import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import ShopHeader from './ShopHeader'
import './Orders.css'
import OrderAddressEditor from './OrderAddressEditor'
import type { DeliveryAddress } from './addressFields'

interface Order {
  _id: string
  createdAt: string
  status: string
  totalPaise: number
  address: DeliveryAddress
  items: { product: string; name: string; quantity: number; unitPricePaise: number }[]
}
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
export default function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [page, setPage] = useState(1)
  const [retry, setRetry] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(false)
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
          ...current.map(saved => data.orders.find((order: Order) => order._id === saved._id) || saved),
          ...data.orders.filter((order: Order) => !current.some(saved => saved._id === order._id)),
        ])
        setHasMore(data.hasMore)
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load your orders.')
      } finally { if (!controller.signal.aborted) setLoading(false) }
    }
    void load()
    return () => controller.abort()
  }, [page, retry, user?.id])
  return <div className="shop-page"><ShopHeader /><main className="shop-content">
    <section className="shop-intro"><span className="shop-eyebrow">YOUR PURCHASES</span><h1>My orders</h1><p>Your everyday finds, all in one place.</p></section>
    {error && <div role="alert"><p>{error}</p><button onClick={() => setRetry(value => value + 1)} disabled={loading || editingOrderId !== null}>Try again</button></div>}
    {loading && <p role="status">Loading orders…</p>}
    {!loading && !error && orders.length === 0 && <div className="shop-state"><p>No orders yet.</p><Link to="/shop">Find something you love</Link></div>}
    <div className="orders-list">{orders.map(order => <article className="order-card" key={order._id}>
      <div className="order-heading"><h2>Order #{order._id.slice(-8).toUpperCase()}</h2><span className="order-status">{order.status === 'placed' ? 'Placed' : order.status}</span></div>
      <p><time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleString('en-IN')}</time></p>
      <ul>{order.items.map(item => <li key={item.product}><span>{item.name} × {item.quantity}</span><strong>{currency.format(item.unitPricePaise * item.quantity / 100)}</strong></li>)}</ul>
      <p><strong>Total: {currency.format(order.totalPaise / 100)}</strong> · Free delivery</p>
      <p>Payment pending · Cash on Delivery</p>
      <h3>Delivery address</h3><address>{order.address.name} · {order.address.phone}<br />{[order.address.line1, order.address.line2, order.address.city, order.address.state, order.address.postalCode].filter(Boolean).join(', ')}</address>
      {editingOrderId === order._id ? <OrderAddressEditor key={order._id} orderId={order._id} initialAddress={order.address}
        onSaved={address => {
          setOrders(current => current.map(saved => saved._id === order._id ? { ...saved, address } : saved))
          setEditingOrderId(null)
        }}
        onCancel={() => { setEditingOrderId(null); setRetry(value => value + 1) }} /> :
        order.status === 'placed' && <button className="order-edit-address" disabled={loading || editingOrderId !== null}
          onClick={() => setEditingOrderId(order._id)}>Edit delivery address</button>}
    </article>)}</div>
    {hasMore && !error && <button disabled={loading || editingOrderId !== null} onClick={() => setPage(value => value + 1)}>Load more orders</button>}
  </main></div>
}
