import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { SalesReport } from '../vendorSalesTypes'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
const compactCurrency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 })
const dayLabel = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const shortDate = (date: string) => dayLabel.format(new Date(`${date}T00:00:00Z`))
const tooltipStyle = { backgroundColor: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--text)' }
const tooltipText = { color: 'var(--text)' }
const tick = { fill: 'var(--text-muted)', fontSize: 12 }

export default function VendorSalesCharts({ report }: { report: SalesReport }) {
  // The API stays in paise; only chart display values are converted to rupees.
  const daily = report.dailySales.days.map(day => ({ ...day, orderedValue: day.orderedValuePaise / 100 }))
  const hasDailyOrders = daily.some(day => day.orderCount > 0)
  return <div className="sales-charts">
    <section className="sales-chart-card" aria-labelledby="daily-sales-title">
      <h2 id="daily-sales-title">Daily ordered value</h2>
      <p className="sales-help">{report.dailySales.from} to {report.dailySales.to} · India time. Shows up to 30 days within your selected period.</p>
      <p className="sales-help">Value of orders placed each day, including those awaiting delivery or cash collection.</p>
      {!hasDailyOrders && <p className="sales-help">No orders in this chart period. Every day is shown as zero.</p>}
      <div className="sales-chart-frame" role="group" aria-label="Daily ordered value in rupees. Exact values are available in the table below.">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={daily} accessibilityLayer margin={{ top: 12, right: 12, bottom: 12, left: 0 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tickFormatter={shortDate} tick={tick} stroke="var(--border-strong)" minTickGap={24} />
            <YAxis tickFormatter={value => compactCurrency.format(Number(value))} tick={tick} stroke="var(--border-strong)" width={72} domain={[0, 'auto']} />
            <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipText} labelStyle={tooltipText} cursor={{ fill: 'var(--brand-soft)' }}
              labelFormatter={label => shortDate(String(label))}
              formatter={value => [currency.format(Number(value)), 'Ordered value']} />
            <Bar dataKey="orderedValue" name="Ordered value" fill="var(--brand)" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="sales-chart-details"><summary>View daily values</summary>
        <div className="sales-table-scroll" tabIndex={0} role="region" aria-label="Daily ordered value table">
          <table><caption>Daily orders and ordered value in India time</caption><thead><tr><th scope="col">Date</th><th scope="col">Orders</th><th scope="col">Ordered value</th></tr></thead>
            <tbody>{daily.map(day => <tr key={day.date}><th scope="row">{day.date}</th><td>{day.orderCount}</td><td>{currency.format(day.orderedValue)}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </section>
    <section className="sales-chart-card" aria-labelledby="top-products-chart-title">
      <h2 id="top-products-chart-title">Top products by units delivered</h2>
      <p className="sales-help">Your top five across the full selected period. Full names and exact totals appear in the products table below.</p>
      {report.topProducts.length === 0 ? <p>No delivered products in this period yet.</p> : <div className="sales-chart-frame" role="group" aria-label="Top five products by delivered quantity.">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart layout="vertical" data={report.topProducts} accessibilityLayer margin={{ top: 12, right: 20, bottom: 12, left: 0 }}>
            <CartesianGrid stroke="var(--border)" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={tick} stroke="var(--border-strong)" domain={[0, 'auto']} />
            <YAxis type="category" dataKey="productId" width={120} tick={tick} stroke="var(--border-strong)" interval={0}
              tickFormatter={id => { const name = report.topProducts.find(product => product.productId === id)?.name || ''; return name.length > 16 ? `${name.slice(0, 16)}…` : name }} />
            <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipText} labelStyle={tooltipText} cursor={{ fill: 'var(--brand-soft)' }}
              labelFormatter={id => report.topProducts.find(product => product.productId === id)?.name || String(id)}
              formatter={value => [Number(value).toLocaleString('en-IN'), 'Units delivered']} />
            <Bar dataKey="deliveredQuantity" name="Units delivered" fill="var(--brand)" radius={[0, 4, 4, 0]} maxBarSize={36} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>}
    </section>
  </div>
}
