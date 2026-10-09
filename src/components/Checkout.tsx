import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { EMPTY_CART, useCartStore } from '../stores/cartStore'
import ShopHeader from './ShopHeader'
import './Orders.css'
import { addressFields as fields } from './addressFields'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

interface Attempt { checkoutKey: string; address: Record<string, string>; items: { cartItemId: string; quantity: number; unitPricePaise: number }[] }

export default function Checkout() {
  const { user } = useAuth()
  const userId = user?.id || ''
  const items = useCartStore(state => state.carts[userId] || EMPTY_CART)
  const cartBusy = useCartStore(state => state.busy || state.refreshing)
  const cartError = useCartStore(state => state.error)
  const loadCart = useCartStore(state => state.loadCart)
  const [address, setAddress] = useState<Record<string, string>>({ name: user?.name || '' })
  const [submitting, setSubmitting] = useState(false)
  const [retryPending, setRetryPending] = useState(false)
  const [error, setError] = useState('')
  const attempt = useRef<Attempt | null>(null)
  const sending = useRef(false)
  const navigate = useNavigate()
  useEffect(() => { if (userId) void loadCart(userId) }, [userId, loadCart])
  const totalPaise = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0)
  const unavailable = items.some(item => item.stock < item.quantity)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || sending.current) return
    sending.current = true
    setSubmitting(true)
    setError('')
    // Keep the same key and payload after a lost response: Retry cannot create a second order.
    attempt.current ||= {
      checkoutKey: crypto.randomUUID(),
      address: Object.fromEntries(fields.map(field => [field.key, (address[field.key] || '').trim()])),
      items: items.map(item => ({ cartItemId: item.cartItemId, quantity: item.quantity, unitPricePaise: Math.round(item.price * 100) })),
    }
    try {
      const response = await fetch('/api/orders', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(attempt.current) })
      const data = await response.json()
      if (!response.ok) {
        if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) {
          attempt.current = null
          setRetryPending(false)
          await loadCart(user.id)
        } else setRetryPending(true)
        throw new Error(data.message || 'Could not place your order. Try again.')
      }
      // Do not let an old account's response affect a newly signed-in account.
      if (useCartStore.getState().ownerId !== user.id) return
      await loadCart(user.id)
      if (useCartStore.getState().ownerId !== user.id) return
      toast.success('Order placed!', { description: 'Pay cash when your order arrives.' })
      navigate('/orders', { replace: true })
    } catch (error) {
      if (attempt.current) setRetryPending(true)
      if (useCartStore.getState().ownerId !== user.id) return
      const message = error instanceof Error ? error.message : 'Could not reach the server. Retry to check your order safely.'
      setError(message)
      toast.error('Could not confirm your order', { description: message })
    } finally { sending.current = false; setSubmitting(false) }
  }
  if (!user) return null
  return <div className="shop-page"><ShopHeader disabled={submitting || retryPending} /><main className="shop-content">
    <section className="shop-intro"><span className="shop-eyebrow">ONE MORE STEP</span><h1>Checkout</h1><p>Cash on delivery ·  Free delivery within India</p></section>
    {error && <p role="alert" className="order-error">{error}</p>}
    {cartError && <p role="alert">{cartError} <button onClick={() => void loadCart(userId)} disabled={cartBusy || submitting}>Refresh cart</button></p>}
    {items?.length === 0 && !retryPending ? <div className="shop-state"><p>{cartBusy ? 'Loading your cart…' : 'Your cart is empty.'}</p><Link to="/shop">Browse products</Link></div> :
      <form className="cart-layout" onSubmit={submit}>
        <section className="checkout-address"><h2>Delivery address</h2>
          <fieldset disabled={submitting || retryPending}>
            {fields.map(field => <label key={field.key} htmlFor={field.key}>{field.label}
              <input id={field.key} name={field.key} required={field.key !== 'line2'} maxLength={field.max} autoComplete={field.auto}
                inputMode={field.key === 'phone' || field.key === 'postalCode' ? 'numeric' : 'text'}
                pattern={'pattern' in field ? field.pattern : undefined} value={address[field.key] || ''}
                onChange={event => setAddress(current => ({ ...current, [field.key]: event.target.value }))} />
            </label>)}
          </fieldset>
        </section>
        <aside className="cart-summary"><h2>Order summary</h2>
          {items.map(item => <p key={item.cartItemId}>{item.name} × {item.quantity} — {currency.format(Math.round(item.price * 100) * item.quantity / 100)}</p>)}
          <div><span>Delivery</span><strong>Free · ₹0</strong></div>
          <div><span>Total</span><strong>{currency.format(totalPaise / 100)}</strong></div>
          <p>Payment: Cash on Delivery. Pay the total when your order arrives.</p>
          {unavailable && <p role="alert">Some items are unavailable or exceed stock. <Link to="/cart">Update your cart</Link>.</p>}
          {retryPending && <p role="status">Your order result could not be confirmed. Retry with the same details, or check <Link to="/orders">My orders</Link> before starting another checkout.</p>}
          <button type="submit" disabled={submitting || (!retryPending && (cartBusy || !!cartError || unavailable || items.length === 0))}>{submitting ? 'Placing order…' : retryPending ? 'Retry / confirm order' : 'Place order · Cash on Delivery'}</button>
          <Link to="/cart">Back to cart</Link>
        </aside>
      </form>}
  </main></div>
}
