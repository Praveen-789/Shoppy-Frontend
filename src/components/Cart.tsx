import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { useDocumentTitle } from '../useDocumentTitle'
import { EMPTY_CART, useCartStore } from '../stores/cartStore'
import { Minus, Plus, RefreshCw, Trash2 } from 'lucide-react'
import ShopHeader from './ShopHeader'
import PageHeader from './PageHeader'
import { Button } from './ui/button'
import './Cart.css'
import './Orders.css'
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

export default function Cart() {
  const { user, message } = useAuth()
  useDocumentTitle('Your cart')
  const userId = user?.id || ''
  const items = useCartStore(state => state.carts[userId] || EMPTY_CART)
  const setQuantity = useCartStore(state => state.setQuantity)
  const removeItem = useCartStore(state => state.removeItem)
  const clearCart = useCartStore(state => state.clearCart)
  const loadCart = useCartStore(state => state.loadCart)
  const checking = useCartStore(state => state.busy)
  const refreshing = useCartStore(state => state.refreshing)
  const error = useCartStore(state => state.error)
  useEffect(() => {
    if (!userId) return
    void loadCart(userId)
    const refresh = () => { void loadCart(userId) }
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [userId, loadCart])
  if (!user) return null
  const subtotal = items.filter(item => item?.stock > 0).reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0) / 100
  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  return <div className="shop-page"><ShopHeader /><main className="shop-content">
    {message && <p role="status">{message}</p>}
    <PageHeader eyebrow="Your everyday finds" title="Your cart" description={`${count} ${count === 1 ? 'item' : 'items'} waiting for you.`}
      actions={<Button variant="outline" aria-disabled={checking || refreshing || undefined} onClick={() => void loadCart(userId)}><RefreshCw aria-hidden="true" />Refresh availability</Button>} />
    <p className="cart-status" role="status">{(checking || refreshing) && <span key={checking ? 'saving' : 'refreshing'}>{checking ? 'Updating your cart...' : 'Refreshing your cart...'}</span>}</p>
    {error && <div role="alert"><p>{error}</p><Button variant="outline" aria-disabled={checking || refreshing || undefined} onClick={() => void loadCart(userId)}>Try again</Button></div>}
    {items?.length === 0 ?  <div className="shop-state"><p>{checking || refreshing ? 'Loading your saved cart...' : error ? 'Your saved cart could not be loaded.' : "Your cart is empty. Let’s find something you love."}</p><Link to="/shop">Browse products</Link></div> : <>
      
      
      <div className="cart-layout"><section aria-label="Cart items">
        {items.map(item => <article className="cart-item" key={item.cartItemId}>
          <div className="cart-image">{item.image ? <img src={item.image} alt={item.name} loading="lazy" onError={event => { event.currentTarget.style.display = 'none' }} /> : null}<span aria-hidden="true">{item.name.charAt(0)}</span></div>
          <div className="cart-item-details"><h2>{item.name}</h2><p>Sold by {item.vendor?.name || 'Vendor'}</p><strong>{currency.format(item.price)} each</strong>
            {item.stock === 0 ? <p className="cart-unavailable">Currently unavailable. Remove this item or check again later.</p> : <p>Available: {item.stock}</p>}
            <div className="cart-quantity"><label htmlFor={`quantity-${item._id}`}>Quantity</label><Button variant="outline" size="icon-sm" aria-label={`Decrease quantity of ${item.name}`} disabled={item.quantity <= 1 || item.stock === 0} aria-disabled={checking || undefined} onClick={() => setQuantity(userId, item.cartItemId, item.quantity - 1)}><Minus aria-hidden="true" /></Button><input id={`quantity-${item._id}`} type="number" min="1" max={item.stock || item.quantity} step="1" disabled={item.stock === 0} readOnly={checking} value={item.quantity} onChange={event => setQuantity(userId, item.cartItemId, Number(event.target.value))} />
            <Button variant="outline" size="icon-sm" aria-label={`Increase quantity of ${item.name}`} disabled={item.quantity >= item.stock} aria-disabled={checking || undefined} onClick={() => setQuantity(userId, item.cartItemId, item.quantity + 1)}><Plus aria-hidden="true" /></Button></div>
            <Button variant="ghost" size="sm" className="text-destructive" aria-disabled={checking || undefined} onClick={() => removeItem(userId, item.cartItemId)} aria-label={`Remove ${item.name} from cart`}><Trash2 aria-hidden="true" />Remove</Button>
          </div><strong className="cart-line-total">{item.stock > 0 ? currency.format(Math.round(item.price * 100) * item.quantity / 100) : 'Unavailable'}</strong>
        </article>)}
        <div className="cart-actions"><Button asChild variant="link" className="px-0"><Link to="/shop">Continue shopping</Link></Button><Button variant="outline" size="sm" aria-disabled={checking || undefined} onClick={() => clearCart(userId)}>Clear cart</Button></div>
      </section><aside className="cart-summary" aria-label="Cart summary"><h2>Order summary</h2><div><span>Subtotal</span><strong>{currency.format(subtotal)}</strong></div><p>Unavailable items are excluded. If stock drops below your quantity, reduce it before checkout. Free delivery. Pay cash when your order arrives.</p>{checking || refreshing || error || items.some(item => item.stock < item.quantity) ? <Button size="lg" className="w-full" disabled>Proceed to checkout</Button> : <Button asChild size="lg" className="w-full"><Link to="/checkout">Proceed to checkout</Link></Button>}<p>Your cart does not reserve stock. Final prices and availability will be confirmed at checkout.</p></aside></div>
    </>}
  </main></div>
}

