import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { useDocumentTitle } from '../useDocumentTitle'
import { EMPTY_WISHLIST, useWishlistStore } from '../stores/wishlistStore'
import { EMPTY_CART, useCartStore } from '../stores/cartStore'
import { RefreshCw } from 'lucide-react'
import ShopHeader from './ShopHeader'
import PageHeader from './PageHeader'
import { Button } from './ui/button'
import './Products.css'
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
export default function Wishlist() {
  const { user } = useAuth()
  useDocumentTitle('Your wishlist')
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
    <PageHeader eyebrow="Saved for later" title="Your wishlist" description="Your favourite finds, ready when you are. Saving does not reserve stock."
      actions={<Button variant="outline" disabled={busy || refreshing} onClick={() => void loadWishlist(userId)}><RefreshCw aria-hidden="true" />Refresh wishlist</Button>} />
    <div className="wishlist-toolbar"><p role="status">{busy ? 'Updating wishlist...' : refreshing ? 'Refreshing wishlist...' : `${items.length} saved ${items.length === 1 ? 'product' : 'products'}`}</p></div>
    {error && <p role="alert">{error}</p>}{cartError && <p role="alert">{cartError}</p>}{notice && <p role="status">{notice}</p>}
    {items.length === 0 ? <div className="shop-state"><p>{refreshing ? 'Loading your saved products...' : error ? 'Your wishlist could not be loaded. Try refreshing.' : 'Nothing saved yet. Find something you love!'}</p><Link to="/shop">Browse products</Link></div> :
      <div className="product-grid">{items.map(item => <article className="product-card" key={item.wishlistItemId}>
        <div className="product-art">{item.image && <img src={item.image} alt={item.name} loading="lazy" onError={event => { event.currentTarget.style.display = 'none' }} />}<span className="product-placeholder" aria-hidden="true">{item.name.charAt(0)}</span></div>
        <div className="product-info"><h2>{item.name}</h2>{item.available ? <><p>Sold by {item.vendor?.name}</p><div className="product-bottom"><strong>{currency.format(item.price)}</strong><span className={item.stock > 0 ? 'stock-available' : 'stock-unavailable'}>{item.stock > 0 ? 'In stock' : 'Sold out'}</span></div></> : <p>This product is no longer available.</p>}</div>
        <div className="product-add">
          {item.available && cartItems.some(product => product._id === item._id) ? <Link className="product-cart-link" to="/cart">Go to cart</Link> : <Button size="lg" className="w-full" disabled={cartBusy || !item.available || item.stock === 0} onClick={async () => { setNotice(''); if (await addItem(userId, item)) setNotice(`${item.name} added to your cart.`) }}>Add to cart</Button>}
          <Button variant="ghost" size="sm" className="w-full text-destructive" disabled={busy} aria-label={`Remove ${item.name} from wishlist`} onClick={() => void removeItem(userId, item.wishlistItemId)}>Remove</Button>
        </div>
      </article>)}</div>}
  </main></div>
}
