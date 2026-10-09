import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../auth/useAuth'
import { fulfilmentSteps, statusLabel, paymentLabel } from '../orderTypes'
import type { VendorOrder } from '../orderTypes'
import ShopHeader from './ShopHeader'
import OrderTimeline from './OrderTimeline'
import './Orders.css'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
export default function VendorOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<VendorOrder[]>([])
  const [page, setPage] = useState(1)
  const [refresh, setRefresh] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [cashChecks, setCashChecks] = useState<Record<string, boolean>>({})
  const request = useRef<AbortController | null>(null)
  useEffect(() => () => request.current?.abort(), [])
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`/api/vendor/orders?page=${page}`, { credentials: 'include', signal: controller.signal })
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Could not load incoming orders.')
        if (controller.signal.aborted) return
        setOrders(data.orders)
        setHasMore(data.hasMore)
        setCashChecks({})
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not reach the server.')
      } finally { if (!controller.signal.aborted) setLoading(false) }
    }
    void load()
    return () => controller.abort()
  }, [page, refresh, user?.id])
  async function advance(order: VendorOrder) {
    if (request.current || loading) return
    const status = fulfilmentSteps[fulfilmentSteps.indexOf(order.status) + 1]
    if (!status || (status === 'delivered' && !cashChecks[order._id])) return
    const controller = new AbortController()
    request.current = controller
    setSavingId(order._id)
    setError('')
    try {
      const response = await fetch(`/api/vendor/orders/${order._id}/status`, {
        method: 'PATCH', credentials: 'include', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedStatus: order.status, status, cashCollected: status === 'delivered' }),
      })
      const data = await response.json()
      if (controller.signal.aborted) return
      if (!response.ok) throw new Error(data.message || 'Could not update delivery status.')
      setOrders(current => current.map(saved => saved._id === order._id ? data.order : saved))
      toast.success(`Order updated: ${statusLabel(status)}`)
    } catch (error) {
      if (!controller.signal.aborted) {
        const message = error instanceof Error ? error.message : 'Could not reach the server.'
        setError(message)
        toast.error('Could not update delivery status', { description: message })
        // Refresh also resolves a lost successful response without advancing twice.
        setRefresh(value => value + 1)
      }
    } finally {
      if (!controller.signal.aborted) { request.current = null; setSavingId(null) }
    }
  }
  if (!user || user.role !== 'vendor') return null
  return <div className="shop-page"><ShopHeader disabled={savingId !== null} /><main className="shop-content">
    <section className="shop-intro"><span className="shop-eyebrow">YOUR STORE</span><h1>Incoming orders</h1><p>Prepare your products, update delivery progress, and record collected cash.</p></section>
    <div className="order-list-actions"><button disabled={loading || savingId !== null} onClick={() => setRefresh(value => value + 1)}>Refresh orders</button><span>Page {page}</span></div>
    {error && <p className="order-error" role="alert">{error}</p>}
    {loading && <p role="status">Loading incoming orders…</p>}
    {!loading && !error && orders.length === 0 && <p className="shop-state">No orders for your products yet.</p>}
    <div className="orders-list">{orders.map(order => {
      const next = fulfilmentSteps[fulfilmentSteps.indexOf(order.status) + 1]
      return <article className="order-card" key={order._id}>
        <div className="order-heading"><h2>Order #{order._id.slice(-8).toUpperCase()}</h2><span className="order-status">{statusLabel(order.status)}</span></div>
        <p><time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleString('en-IN')}</time></p>
        <ul>{order.items.map(item => <li key={item.product}><span>{item.name} × {item.quantity}</span><strong>{currency.format(item.unitPricePaise * item.quantity / 100)}</strong></li>)}</ul>
        <p><strong>Your COD amount: {currency.format(order.subtotalPaise / 100)}</strong> · {paymentLabel(order.paymentStatus)}</p>
        <h3>Deliver to</h3><address>{order.address.name} · {order.address.phone}<br />{[order.address.line1, order.address.line2, order.address.city, order.address.state, order.address.postalCode].filter(Boolean).join(', ')}</address>
        <OrderTimeline history={order.history} />
        {next && <div className="vendor-fulfilment-actions">
          {next === 'delivered' && <label className="cash-confirm"><input type="checkbox" checked={cashChecks[order._id] || false}
            disabled={loading || savingId !== null} onChange={event => setCashChecks(current => ({ ...current, [order._id]: event.target.checked }))} />
            I confirm delivery and collection of {currency.format(order.subtotalPaise / 100)} cash.</label>}
          <button disabled={loading || savingId !== null || (next === 'delivered' && !cashChecks[order._id])} onClick={() => void advance(order)}>
            {savingId === order._id ? 'Updating…' : next === 'delivered' ? 'Mark delivered & cash collected' : `Mark ${statusLabel(next).toLowerCase()}`}
          </button>
        </div>}
      </article>
    })}</div>
    <div className="order-list-actions"><button disabled={loading || savingId !== null || page === 1} onClick={() => setPage(value => value - 1)}>Previous</button><button disabled={loading || savingId !== null || !hasMore} onClick={() => setPage(value => value + 1)}>Next</button></div>
  </main></div>
}
