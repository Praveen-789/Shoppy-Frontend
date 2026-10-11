import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { EMPTY_WISHLIST, useWishlistStore } from '../stores/wishlistStore'
import { EMPTY_CART, useCartStore } from '../stores/cartStore'
import ShopHeader from './ShopHeader'
import './Products.css'
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
export default function Wishlist() {
  const { user } = useAuth()
  const userId = user?.id || ''
  const items = useWishlistStore(state => state.wishlists[userId] || EMPTY_WISHLIST)
  const busy = useWishlistStore(state => state.busy)
  const refreshing = useWishlistStore(state => state.refreshing)
  const error = useWishlistStore(state => state.error)
  const loadWishlist = useWishlistStore(state => state.loadWishlist)
  const removeItem = useWishlistStore(state => state.removeItem)
  const cartItems = useCartStore(state => state.carts[userId] || EMPTY_CART)
  const cartBusy = useCartStore(state => state.busy)
  const cartError = useCartStore(state => state.error)
  const addItem = useCartStore(state => state.addItem)
  const [notice, setNotice] = useState('')
  useEffect(() => {
    if (!userId) return
    const refresh = () => { void loadWishlist(userId) }
    refresh()
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [userId, loadWishlist])
  if (!user) return null
  return <div className="shop-page"><ShopHeader /><main className="shop-content">
    <section className="shop-intro"><span className="shop-eyebrow">SAVED FOR LATER</span><h1>Your wishlist</h1><p>Your favourite finds, ready when you are. Saving does not reserve stock.</p></section>
    <div className="wishlist-toolbar"><p role="status">{busy ? 'Updating wishlist...' : refreshing ? 'Refreshing wishlist...' : `${items.length} saved ${items.length === 1 ? 'product' : 'products'}`}</p><button disabled={busy || refreshing} onClick={() => void loadWishlist(userId)}>Refresh wishlist</button></div>
    {error && <p role="alert">{error}</p>}{cartError && <p role="alert">{cartError}</p>}{notice && <p role="status">{notice}</p>}
    {items.length === 0 ? <div className="shop-state"><p>{refreshing ? 'Loading your saved products...' : error ? 'Your wishlist could not be loaded. Try refreshing.' : 'Nothing saved yet. Find something you love!'}</p><Link to="/shop">Browse products</Link></div> :
      <div className="product-grid">{items.map(item => <article className="product-card" key={item.wishlistItemId}>
        <div className="product-art">{item.image && <img src={item.image} alt={item.name} loading="lazy" onError={event => { event.currentTarget.style.display = 'none' }} />}<span className="product-placeholder" aria-hidden="true">{item.name.charAt(0)}</span></div>
        <div className="product-info"><h2>{item.name}</h2>{item.available ? <><p>Sold by {item.vendor?.name}</p><div className="product-bottom"><strong>{currency.format(item.price)}</strong><span className={item.stock > 0 ? 'stock-available' : 'stock-unavailable'}>{item.stock > 0 ? 'In stock' : 'Sold out'}</span></div></> : <p>This product is no longer available.</p>}</div>
        <div className="product-add">
          {item.available && cartItems.some(product => product._id === item._id) ? <Link className="product-cart-link" to="/cart">Go to cart</Link> : <button disabled={cartBusy || !item.available || item.stock === 0} onClick={async () => { setNotice(''); if (await addItem(userId, item)) setNotice(`${item.name} added to your cart.`) }}>Add to cart</button>}
          <button disabled={busy} aria-label={`Remove ${item.name} from wishlist`} onClick={() => void removeItem(userId, item.wishlistItemId)}>Remove</button>
        </div>
      </article>)}</div>}
  </main></div>
}
