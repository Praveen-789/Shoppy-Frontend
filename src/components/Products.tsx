import { useRequireSignIn } from '../auth/useRequireSignIn'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import ShopHeader from './ShopHeader'
import CategoryNavigation from './CategoryNavigation'
import { EMPTY_CART, useCartStore } from '../stores/cartStore'
import WishlistButton from './WishlistButton'
import RatingStars from './RatingStars'
import { useWishlistStore } from '../stores/wishlistStore'
import './Products.css'
import type { Product } from '../productTypes'
import ShopFilters from './ShopFilters'
import { Button } from './ui/button'
import { activeFilterCount, emptyProductFilters, productSearchParams } from '../productFilters'
import type { ProductFilters, ProductQuery } from '../productFilters'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

export default function Products() {
  const { requireSignIn } = useRequireSignIn()
  const { user, message, checkingSession } = useAuth()
  const cartItems = useCartStore(state => user ? state.carts[user.id] || EMPTY_CART : EMPTY_CART)
  const addItem = useCartStore(state => state.addItem)
  const cartBusy = useCartStore(state => state.busy)
  const cartError = useCartStore(state => state.error)
  const wishlistError = useWishlistStore(state => state.error)
  const [cartNotice, setCartNotice] = useState('')
  const [addingProductId, setAddingProductId] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [query, setQuery] = useState<ProductQuery>({ search: '', category: '', page: 1, ...emptyProductFilters() })
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
        const params = productSearchParams(query)
        const response = await fetch(`/api/products?${params}`, { signal: controller.signal })
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Could not load products. Please try again.')
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

  function selectCategory(category: string) {
    if (category === query.category) return
    setProducts([])
    setLoading(true)
    setQuery({ search: search.trim(), category, page: 1, ...emptyProductFilters() })
  }

  function applyFilters(filters: ProductFilters) {
    setProducts([])
    setLoading(true)
    setQuery(current => ({ ...current, ...filters, search: search.trim(), page: 1 }))
  }

  const filterCount = activeFilterCount(query)


  return (
    <div className={cartCount > 0 ? 'shop-page shop-page-with-cart-bar' : 'shop-page'}>
      <ShopHeader />
      <CategoryNavigation categories={categories} selected={query.category} onSelect={selectCategory} />
      <main className="shop-content">
        {message && <p className="shop-message" role="status">{message}</p>}{cartError && <p role="alert">{cartError}</p>}{wishlistError && <p role="alert">{wishlistError}</p>}{cartNotice && <p className="shop-message" role="status">{cartNotice}</p>}
        <section className="shop-intro">
          <span className="shop-eyebrow">THE EVERYDAY COLLECTION</span>
          <h1>Little finds. Lots to love.</h1>
          <p>Thoughtful essentials for your home, your desk, and your everyday.</p>
        </section>
        <div className="shop-filters">
          <div className="shop-search"><label htmlFor="product-search">Search products</label><input id="product-search" type="search" maxLength={120} placeholder="Find your next favourite" value={search} onChange={event => setSearch(event.target.value)} /></div>
        </div>
        <div className="catalog-layout">
          <ShopFilters key={query.category} category={query.category} filters={query} onChange={applyFilters} onClear={() => applyFilters(emptyProductFilters())} />
          <section className="catalog-results" aria-label="Product results" aria-busy={loading || searching}>
          {filterCount > 0 && <div className="active-filter-summary"><span>{filterCount} active {filterCount === 1 ? 'filter' : 'filters'}</span><Button variant="ghost" size="sm" onClick={() => applyFilters(emptyProductFilters())}>Clear filters</Button></div>}
        {searching || (loading && query.page === 1) ? <p className="shop-state" role="status">Finding the good stuff…</p> : error && products.length === 0 ? (
          <div className="shop-state" role="alert"><p>{error}</p><button onClick={() => setRetry(value => value + 1)}>Try again</button></div>
        ) : products?.length === 0 ? <div className="shop-state" role="status"><p>{query.search || query.category || filterCount ? 'No products match. Try another search or adjust your filters.' : 'Our shelves are getting ready. Check back soon!'}</p>{filterCount > 0 && <Button variant="outline" onClick={() => applyFilters(emptyProductFilters())}>Reset filters</Button>}</div> : (
          <>
            <p className="shop-count" role="status">Showing {products.length} of {total} {total === 1 ? 'product' : 'products'}</p>
              <div className="product-grid">{products.map(product => (
                <article className="product-card" key={product._id}>
                  {/* The heart is a sibling of the image link, not a child: a button inside a link is invalid HTML. */}
                  <div className="product-media">
                    <Link className="product-art" to={`/shop/products/${product._id}`} aria-label={`View ${product.name}`}>
                      {product.image ? <img src={product.image} alt={product.name} loading="lazy" onError={event => { event.currentTarget.style.display = 'none' }} /> : null}
                      <span className="product-placeholder" aria-hidden="true">{product.name.charAt(0)}</span>
                    </Link>
                    <WishlistButton product={product} variant="icon" />
                  </div>
                  <div className="product-info"><span className="product-category">{product.category}</span><h2><Link className="product-name-link" to={`/shop/products/${product._id}`}>{product.name}</Link></h2><p>{product.description}</p><div className="product-bottom"><strong>{currency.format(product.price)}</strong><span className={product.stock > 0 ? 'stock-available' : 'stock-unavailable'}>{product.stock > 0 ? 'In stock' : 'Sold out'}</span></div></div>
                  <p className="product-seller">Sold by {product.vendor?.name || 'Vendor'}</p>
                  <div className="catalog-rating"><RatingStars rating={product.ratingSummary?.average || 0} /><span>{product.ratingSummary?.count ? `${product.ratingSummary.average.toFixed(1)} (${product.ratingSummary.count})` : 'No reviews yet'}</span></div>
                  <div className="product-add">
                    {cartItems.some(item => item._id === product._id) ? (
                      <>
                        <span className="product-added">✓ Added to cart</span>
                        <Link className="product-cart-link" to="/cart" aria-label={`Go to cart, ${product.name} is added`}>Go to cart →</Link>
                      </>
                    ) : (
                      <button disabled={checkingSession || cartBusy || product.stock === 0} onClick={async () => {
                        if (!user) { requireSignIn(); return }
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
          </section>
        </div>
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





