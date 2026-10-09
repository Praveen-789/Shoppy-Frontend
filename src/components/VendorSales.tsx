import { lazy, Suspense, useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import ShopHeader from './ShopHeader'
import './VendorSales.css'
import type { SalesReport } from '../vendorSalesTypes'

const VendorSalesCharts = lazy(() => import('./VendorSalesCharts'))
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
const money = (paise: number) => currency.format(paise / 100)

export default function VendorSales() {
  const { user } = useAuth()
  const userId = user?.id
  const role = user?.role
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [period, setPeriod] = useState({ from: '', to: '' })
  const [refresh, setRefresh] = useState(0)
  const [result, setResult] = useState<{ userId: string; report: SalesReport } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterError, setFilterError] = useState('')

  useEffect(() => {
    if (!userId || role !== 'vendor') return
    const accountId = userId
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError('')
      setResult(null)
      try {
        const params = new URLSearchParams()
        if (period.from) params.set('from', period.from)
        if (period.to) params.set('to', period.to)
        const response = await fetch(`/api/vendor/sales?${params}`, { credentials: 'include', signal: controller.signal })
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Could not load sales. Please try again.')
        if (!controller.signal.aborted) setResult({ userId: accountId, report: data })
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not reach the server.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [period, refresh, userId, role])

  if (!user || user.role !== 'vendor') return null
  const report = result?.userId === user.id ? result.report : null
  const periodLabel = period.from && period.to ? `${period.from} to ${period.to}`
    : period.from ? `From ${period.from}` : period.to ? `Through ${period.to}` : 'All time'
  return <div className="shop-page"><ShopHeader /><main className="shop-content sales-content">
    <section className="shop-intro"><span className="shop-eyebrow">YOUR STORE</span><h1>Your sales, at a glance.</h1><p>See what is selling and how much cash has been collected.</p></section>
    <form className="sales-filters" onSubmit={event => {
      event.preventDefault()
      if (from && to && from > to) { setFilterError('Choose an end date on or after the start date.'); return }
      setFilterError('')
      setPeriod({ from, to })
    }}>
      <label htmlFor="sales-from">From<input id="sales-from" type="date" value={from} onChange={event => setFrom(event.target.value)} /></label>
      <label htmlFor="sales-to">To<input id="sales-to" type="date" value={to} onChange={event => setTo(event.target.value)} /></label>
      <button type="submit" disabled={loading}>Apply dates</button>
      <button type="button" disabled={loading} onClick={() => { setFrom(''); setTo(''); setFilterError(''); setPeriod({ from: '', to: '' }) }}>All time</button>
      <button type="button" disabled={loading} onClick={() => setRefresh(value => value + 1)}>Refresh sales</button>
    </form>
    {filterError && <p className="sales-error" role="alert">{filterError}</p>}
    <p className="sales-period">{periodLabel} · India time</p>
    <p className="sales-help">Dates select when orders were placed. Totals show their current delivery and cash collection progress.</p>
    {loading && <p className="shop-state" role="status">Loading your sales…</p>}
    {error && <div className="sales-error" role="alert"><p>{error}</p><button onClick={() => setRefresh(value => value + 1)}>Try again</button></div>}
    {!loading && !error && report && <>
      {report.summary.orderCount === 0 && <p className="sales-empty" role="status">No orders in this period yet. Your next sale will appear here.</p>}
      <section className="sales-grid" aria-label="Sales summary">
        {[
          ['Orders', String(report.summary.orderCount), 'Orders containing your products'],
          ['Delivered orders', String(report.summary.deliveredOrderCount), 'Your portion has been delivered'],
          ['Ordered value', money(report.summary.orderedValuePaise), 'Value of all your purchased products'],
          ['Delivered sales', money(report.summary.deliveredSalesPaise), 'Value of your delivered products'],
          ['COD collected', money(report.summary.collectedCodPaise), 'Cash recorded as collected'],
          ['COD pending', money(report.summary.pendingCodPaise), 'Expected cash, including unshipped orders'],
        ].map(([label, value, help]) => <article className="sales-card" key={label}><h2>{label}</h2><strong>{value}</strong><p>{help}</p></article>)}
      </section>
      <Suspense fallback={<p role="status">Loading charts…</p>}><VendorSalesCharts report={report} /></Suspense>
      <section className="sales-products"><h2>Top-selling products</h2><p className="sales-help">Your top five by delivered quantity in this period.</p>
        {report?.topProducts.length === 0 ? <p>No delivered products in this period yet.</p> : <div className="sales-table-scroll" tabIndex={0} role="region" aria-label="Top-selling products table">
          <table><caption className="sales-help">Purchased names and prices are used for historical sales.</caption><thead><tr><th scope="col">Product</th><th scope="col">Units delivered</th><th scope="col">Delivered sales</th></tr></thead>
            <tbody>{report?.topProducts.map(product => <tr key={product.productId}><th scope="row">{product.name}</th><td>{product.deliveredQuantity}</td><td>{money(product.deliveredSalesPaise)}</td></tr>)}</tbody>
          </table>
        </div>}
      </section>
    </>}
  </main></div>
}
