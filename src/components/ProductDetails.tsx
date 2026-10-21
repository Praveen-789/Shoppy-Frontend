import { useRequireSignIn } from '../auth/useRequireSignIn'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { EMPTY_CART, useCartStore } from '../stores/cartStore'
import { useWishlistStore } from '../stores/wishlistStore'
import type { Product } from '../productTypes'
import ShopHeader from './ShopHeader'
import WishlistButton from './WishlistButton'
import ProductGallery from './ProductGallery'
import ProductReviews from './ProductReviews'
import './ProductDetails.css'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

export default function ProductDetails() {
  const { id } = useParams()
  // Remount local state when navigating directly between product URLs.
  return <ProductDetailsContent key={id} id={id} />
}

function ProductDetailsContent({ id }: { id: string | undefined }) {
  const { requireSignIn } = useRequireSignIn()
  const { user, checkingSession } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unavailable, setUnavailable] = useState(false)
  const [retry, setRetry] = useState(0)
  const [quantity, setQuantity] = useState('1')
  const [notice, setNotice] = useState('')
  const items = useCartStore(state => user ? state.carts[user.id] || EMPTY_CART : EMPTY_CART)
  const busy = useCartStore(state => state.busy)
  const refreshing = useCartStore(state => state.refreshing)
  const cartError = useCartStore(state => state.error)
  const addItem = useCartStore(state => state.addItem)
  const wishlistError = useWishlistStore(state => state.error)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError('')
      setUnavailable(false)
      try {
        const response = await fetch(`/api/products/${encodeURIComponent(id || '')}`, { signal: controller.signal })
        if (response.status === 400 || response.status === 404) {
          setUnavailable(true)
          return
        }
        if (!response.ok) throw new Error('Could not load this product. Please try again.')
        const data = await response.json()
        if (!controller.signal.aborted) setProduct(data.product)
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load this product.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [id, retry])

  const inCart = items.find(item => item._id === product?._id)?.quantity || 0
  const remaining = product ? Math.max(0, Math.min(1000000, product.stock - inCart)) : 0
  const amount = Number(quantity)
  const validQuantity = Number.isSafeInteger(amount) && amount >= 1 && amount <= remaining

  return <div className="shop-page">
    <ShopHeader />
    <main className="shop-content">
      <Link className="details-back" to="/shop">← Back to shop</Link>
      {loading ? <p className="shop-state" role="status">Loading product…</p> : unavailable ?
        <div className="shop-state"><h1>Product unavailable</h1><p>This product may have been removed or unpublished. Browse the shop for more finds.</p></div> : error ?
        <div className="shop-state" role="alert"><p>{error}</p><button onClick={() => setRetry(value => value + 1)}>Try again</button></div> : product &&
        <article className="product-details">
          <ProductGallery product={product} />
          <div className="details-info">
            <span className="product-category">{product.category}</span>
            <h1>{product.name}</h1>
            <p className="details-seller">Sold by {product.vendor?.name || 'Vendor'}</p>
            <p className="details-price">{currency.format(product.price)}</p>
            <p className={product.stock > 0 ? 'stock-available details-stock' : 'stock-unavailable details-stock'}>{product.stock > 0 ? `${product.stock} in stock` : 'Sold out'}</p>
            <h2>About this product</h2>
            <p className="details-description">{product.description}</p>
            <p className="details-delivery">Free delivery within India · Cash on delivery</p>
            <form className="details-actions" onSubmit={async event => {
              event.preventDefault()
              if (!validQuantity || busy || refreshing) return
              if (!user) { requireSignIn(); return }
              setNotice('')
              const added = await addItem(user.id, product, amount)
              if (added) { setNotice(`${amount} ${amount === 1 ? 'item' : 'items'} added to your cart.`); setQuantity('1') }
            }}>
              <label htmlFor="details-quantity">Quantity to add</label>
              <input id="details-quantity" type="number" min="1" max={Math.max(1, remaining)} step="1" value={quantity} disabled={remaining === 0 || busy || refreshing} onChange={event => { setQuantity(event.target.value); setNotice('') }} />
              {inCart > 0 && <p>{inCart} already in your cart. <Link to="/cart">View cart →</Link></p>}
              {remaining > 0 && !validQuantity && <p role="alert">Choose a whole number from 1 to {remaining}.</p>}
              <button className="details-add-button" type="submit" disabled={checkingSession || !validQuantity || busy || refreshing}>{busy ? 'Updating cart…' : product.stock === 0 ? 'Sold out' : remaining === 0 ? 'All available stock is in your cart' : 'Add to cart'}</button>
            </form>
            <WishlistButton product={product} />
            {notice && <p className="shop-message" role="status">{notice} <Link to="/cart">Go to cart →</Link></p>}
            {cartError && <p role="alert">{cartError}</p>}
            {wishlistError && <p role="alert">{wishlistError}</p>}
          </div>
          <ProductReviews productId={product._id} productName={product.name} />
        </article>}
    </main>
    <footer className="shop-footer">A little joy, delivered. · Shoppy</footer>
  </div>
}
