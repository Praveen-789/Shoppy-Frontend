import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { statusLabel, paymentLabel, canCancelOrder, canCancelItem, payableAmount } from '../orderTypes'
import type { CustomerOrder, OrderItem } from '../orderTypes'
import ShopHeader from './ShopHeader'
import './Orders.css'
import OrderAddressEditor from './OrderAddressEditor'
import OrderTimeline from './OrderTimeline'
import OrderCancellation from './OrderCancellation'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
export default function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [page, setPage] = useState(1)
  const [retry, setRetry] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const [cancellingItem, setCancellingItem] = useState<OrderItem | undefined>()
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`/api/orders?page=${page}`, { credentials: 'include', signal: controller.signal })
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Could not load your orders.')
        if (controller.signal.aborted) return
        setOrders(current => page === 1 ? data.orders : [
          ...current.map(saved => data.orders.find((order: CustomerOrder) => order._id === saved._id) || saved),
          ...data.orders.filter((order: CustomerOrder) => !current.some(saved => saved._id === order._id)),
        ])
        setHasMore(data.hasMore)
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load your orders.')
      } finally { if (!controller.signal.aborted) setLoading(false) }
    }
    void load()
    return () => controller.abort()
  }, [page, retry, user?.id])
  return <div className="shop-page"><ShopHeader disabled={cancellingOrderId !== null} /><main className="shop-content">
    <section className="shop-intro"><span className="shop-eyebrow">YOUR PURCHASES</span><h1>My orders</h1><p>Track each seller's delivery. Pay their COD amount when that delivery arrives.</p></section>
    <div className="order-list-actions"><button disabled={loading || editingOrderId !== null || cancellingOrderId !== null} onClick={() => { setPage(1); setRetry(value => value + 1) }}>Refresh orders</button></div>
    {error && <div role="alert"><p>{error}</p><button onClick={() => setRetry(value => value + 1)} disabled={loading || editingOrderId !== null || cancellingOrderId !== null}>Try again</button></div>}
    {loading && <p role="status">Loading orders…</p>}
    {!loading && !error && orders.length === 0 && <div className="shop-state"><p>No orders yet.</p><Link to="/shop">Find something you love</Link></div>}
    <div className="orders-list">{orders.map(order => <article className="order-card" key={order._id}>
      <div className="order-heading"><h2>Order #{order._id.slice(-8).toUpperCase()}</h2><span className="order-status">{statusLabel(order.status)}</span></div>
      <p><time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleString('en-IN')}</time></p>
      {order.vendorOrders.map(portion => <section className="vendor-order-portion" key={portion.vendor} aria-label={`Delivery from ${portion.vendorName}`}>
        <div className="order-heading"><h3>{portion.vendorName}</h3><span className="order-status">{statusLabel(portion.status)}</span></div>
        <ul>{order.items.filter(item => item.vendor === portion.vendor).map(item => <li key={item.product}>
          <div className="order-item-details"><span>{item.name} × {item.quantity}</span>
            {(item.status === 'cancelled' || portion.status === 'cancelled') && <span className="order-help">Cancelled — not included in COD{item.cancelledAt && <> · <time dateTime={item.cancelledAt}>{new Date(item.cancelledAt).toLocaleString('en-IN')}</time></>}</span>}
            {canCancelItem(order, item) && <button className="order-item-cancel" aria-label={`Cancel ${item.name}`} disabled={loading || editingOrderId !== null || cancellingOrderId !== null}
              onClick={() => { setCancellingItem(item); setCancellingOrderId(order._id) }}>Cancel product</button>}
          </div><strong>{currency.format(item.unitPricePaise * item.quantity / 100)}</strong>
        </li>)}</ul>
        <p><strong>Seller COD amount: {currency.format(payableAmount(portion) / 100)}</strong> · {paymentLabel(portion.paymentStatus)}</p>
        {payableAmount(portion) !== portion.subtotalPaise && <p className="order-help">Original seller subtotal: {currency.format(portion.subtotalPaise / 100)}</p>}
        <OrderTimeline history={portion.history} />
      </section>)}
      <p><strong>{payableAmount(order) !== order.totalPaise ? 'Total after cancellations:' : 'Total:'} {currency.format(payableAmount(order) / 100)}</strong> · Free delivery</p>
      {payableAmount(order) !== order.totalPaise && <p className="order-help">Original total: {currency.format(order.totalPaise / 100)}</p>}
      <p>{paymentLabel(order.paymentStatus)} · Cash on Delivery</p>
      {order.cancelledAt && <p>Cancelled on <time dateTime={order.cancelledAt}>{new Date(order.cancelledAt).toLocaleString('en-IN')}</time></p>}
      <h3>Delivery address</h3><address>{order.address.name} · {order.address.phone}<br />{[order.address.line1, order.address.line2, order.address.city, order.address.state, order.address.postalCode].filter(Boolean).join(', ')}</address>
      {editingOrderId === order._id ? <OrderAddressEditor key={order._id} orderId={order._id} initialAddress={order.address}
        onSaved={address => {
          setOrders(current => current.map(saved => saved._id === order._id ? { ...saved, address } : saved))
          setEditingOrderId(null)
        }}
        onCancel={() => { setEditingOrderId(null); setRetry(value => value + 1) }} /> :
        order.status === 'placed' && order.vendorOrders.every(portion => portion.status === 'placed' || portion.status === 'cancelled') ? <button className="order-edit-address" disabled={loading || editingOrderId !== null || cancellingOrderId !== null}
          onClick={() => setEditingOrderId(order._id)}>Edit delivery address</button> : <p className="order-help">{order.status === 'cancelled' ? 'This order was cancelled. No delivery or payment is due.' : 'Address editing closes after a seller confirms the order.'}</p>}
      {cancellingOrderId === order._id ? <OrderCancellation key={`${user?.id}-${order._id}`} orderId={order._id} item={cancellingItem}
        onSaved={updated => {
          setOrders(current => current.map(saved => saved._id === updated._id ? updated : saved))
          setCancellingOrderId(null)
        }}
        onClose={() => { setCancellingOrderId(null); setPage(1); setRetry(value => value + 1) }} /> :
        canCancelOrder(order) && <button className="order-cancel-button" disabled={loading || editingOrderId !== null || cancellingOrderId !== null}
          onClick={() => { setCancellingItem(undefined); setCancellingOrderId(order._id) }}>Cancel order</button>}
    </article>)}</div>
    {hasMore && !error && <button disabled={loading || editingOrderId !== null || cancellingOrderId !== null} onClick={() => setPage(value => value + 1)}>Load more orders</button>}
  </main></div>
}
