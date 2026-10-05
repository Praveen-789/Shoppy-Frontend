import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import ShopHeader from './ShopHeader'
import { EMPTY_CART, useCartStore } from '../stores/cartStore'
import './Products.css'

interface Product {
  _id: string
  name: string
  description: string
  price: number
  category: string
  image: string
  stock: number
  vendor?: { _id: string; name: string } | null
}

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

export default function Products() {
  const { user, message } = useAuth()
  const cartItems = useCartStore(state => user ? state.carts[user.id] || EMPTY_CART : EMPTY_CART)
  const addItem = useCartStore(state => state.addItem)
  const cartBusy = useCartStore(state => state.busy)
  const cartError = useCartStore(state => state.error)
  const [cartNotice, setCartNotice] = useState('')
  const [addingProductId, setAddingProductId] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [query, setQuery] = useState({ search: '', category: '', page: 1 })
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  // Search after a short pause in typing, rather than on every keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(current => current.search === search.trim() ? current : { ...current, search: search.trim(), page: 1 })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const controller = new AbortController()
    async function loadProducts() {
      setLoading(true)
      setError('')
      if (query.page === 1) setProducts([])
      try {
        const params = new URLSearchParams({ page: String(query.page), limit: '12', search: query.search, category: query.category })
        const response = await fetch(`/api/products?${params}`, { signal: controller.signal })
        if (!response.ok) throw new Error('Could not load products. Please try again.')
        const data = await response.json()
        if (controller.signal.aborted) return
        setProducts(current => query.page === 1 ? data.products : [...current, ...data.products])
        setCategories(data.categories)
        setTotal(data.pagination.total)
        setHasMore(data.pagination.hasMore)
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load products.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void loadProducts()
    return () => controller.abort()
  }, [retry, query])

  const searching = search.trim() !== query.search
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0)

  if (!user) return null

  return (
    <div className={cartCount > 0 ? 'shop-page shop-page-with-cart-bar' : 'shop-page'}>
      <ShopHeader />
      <main className="shop-content">
        {message && <p className="shop-message" role="status">{message}</p>}{cartError && <p role="alert">{cartError}</p>}{cartNotice && <p className="shop-message" role="status">{cartNotice}</p>}
        <section className="shop-intro">
          <span className="shop-eyebrow">THE EVERYDAY COLLECTION</span>
          <h1>Little finds. Lots to love.</h1>
          <p>Thoughtful essentials for your home, your desk, and your everyday.</p>
        </section>
        <div className="shop-filters">
          <div className="shop-search"><label htmlFor="product-search">Search products</label><input id="product-search" type="search" maxLength={120} placeholder="Find your next favourite…" value={search} onChange={event => setSearch(event.target.value)} /></div>
          <div className="shop-category"><label htmlFor="product-category">Category</label><select id="product-category" value={query.category} onChange={event => { setProducts([]); setLoading(true); setQuery(current => ({ ...current, category: event.target.value, page: 1 })) }}><option value="">All</option>{categories.map(item => <option key={item} value={item}>{item}</option>)}</select></div>
        </div>
        {searching || (loading && query.page === 1) ? <p className="shop-state" role="status">Finding the good stuff…</p> : error && products.length === 0 ? (
          <div className="shop-state" role="alert"><p>{error}</p><button onClick={() => setRetry(value => value + 1)}>Try again</button></div>
        ) : products?.length === 0 ? <p className="shop-state">{query.search || query.category ? 'No products match. Try another search or category.' : 'Our shelves are getting ready. Check back soon!'}</p> : (
          <>
            <p className="shop-count" role="status">Showing {products.length} of {total} {total === 1 ? 'product' : 'products'}</p>
              <div className="product-grid">{products.map(product => (
                <article className="product-card" key={product._id}>
                  <div className="product-art">
                    {product.image ? <img src={product.image} alt={product.name} loading="lazy" onError={event => { event.currentTarget.style.display = 'none' }} /> : null}
                    <span className="product-placeholder" aria-hidden="true">{product.name.charAt(0)}</span>
                  </div>
                  <div className="product-info"><span className="product-category">{product.category}</span><h2>{product.name}</h2><p>{product.description}</p><div className="product-bottom"><strong>{currency.format(product.price)}</strong><span className={product.stock > 0 ? 'stock-available' : 'stock-unavailable'}>{product.stock > 0 ? 'In stock' : 'Sold out'}</span></div></div>
                  <p className="product-seller">Sold by {product.vendor?.name || 'Vendor'}</p>
                  <div className="product-add">
                    {cartItems.some(item => item._id === product._id) ? (
                      <>
                        <span className="product-added">✓ Added to cart</span>
                        <Link className="product-cart-link" to="/cart" aria-label={`Go to cart, ${product.name} is added`}>Go to cart →</Link>
                      </>
                    ) : (
                      <button disabled={cartBusy || product.stock === 0} onClick={async () => {
                        setCartNotice('')
                        setAddingProductId(product._id)
                        try {
                          const added = await addItem(user.id, product)
                          setCartNotice(added ? `${product.name} added to your cart.` : '')
                        } finally {
                          setAddingProductId(null)
                        }
                      }}>{addingProductId === product._id ? 'Adding…' : product.stock === 0 ? 'Sold out' : 'Add to cart'}</button>
                    )}
                  </div>
                </article>
              ))}</div>
            <div className="shop-load-more">
              {error ? <div role="alert"><p>{error}</p><button onClick={() => setRetry(value => value + 1)} disabled={loading}>Try again</button></div> : hasMore && <button disabled={loading} onClick={() => { setLoading(true); setQuery(current => ({ ...current, page: current.page + 1 })) }}>{loading ? 'Loading…' : 'Load more products'}</button>}
              {loading && <p role="status">Loading more products…</p>}
            </div>
          </>
        )}
      </main>
      {cartCount > 0 && (
        <nav className="mobile-cart-bar" aria-label="Cart shortcut">
          <span>{cartCount} {cartCount === 1 ? 'item' : 'items'} in your cart</span>
          <Link to="/cart">Go to cart →</Link>
        </nav>
      )}
      <footer className="shop-footer">A little joy, delivered. · Shoppy</footer>
    </div>
  )
}





