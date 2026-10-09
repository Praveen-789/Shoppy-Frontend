import type { StatusEvent } from '../orderTypes'
import { statusLabel } from '../orderTypes'

export default function OrderTimeline({ history }: { history: StatusEvent[] }) {
  return <ol className="order-timeline" aria-label="Delivery history">
    {history.map(event => <li key={event.status}>
      <span>{statusLabel(event.status)}</span>
      <time dateTime={event.at}>{new Date(event.at).toLocaleString('en-IN')}</time>
    </li>)}
  </ol>
}
