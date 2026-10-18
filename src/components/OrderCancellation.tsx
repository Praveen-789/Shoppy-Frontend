import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { CustomerOrder, OrderItem } from '../orderTypes'

interface Props {
  orderId: string
  item?: OrderItem
  onSaved: (order: CustomerOrder) => void
  onClose: () => void
}

export default function OrderCancellation({ orderId, item, onSaved, onClose }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const request = useRef<AbortController | null>(null)
  const dialog = useRef<HTMLDialogElement | null>(null)
  useEffect(() => {
    const element = dialog.current
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    element?.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      element?.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus()
    }
  }, [])
  useEffect(() => () => request.current?.abort(), [])

  async function cancelOrder() {
    if (request.current || error) return
    const controller = new AbortController()
    request.current = controller
    setSaving(true)
    try {
      const response = await fetch(`/api/orders/${orderId}${item ? `/items/${item.product}` : ''}/cancel`, {
        method: 'PATCH', credentials: 'include', signal: controller.signal,
      })
      const data = await response.json()
      if (controller.signal.aborted) return
      if (!response.ok) throw new Error(data.message || 'Could not cancel your order.')
      onSaved(data.order)
      toast.success(item ? 'Product cancelled. Your order total has been updated.' : 'Order cancelled. No payment is due.')
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not reach the server.')
    } finally {
      if (!controller.signal.aborted) { request.current = null; setSaving(false) }
    }
  }

  return <dialog ref={dialog} className="order-cancellation" aria-labelledby={`cancel-${orderId}`} aria-describedby={`cancel-description-${orderId}`}
    onCancel={event => {
      event.preventDefault()
      if (!request.current) onClose()
    }}>
    <h3 id={`cancel-${orderId}`}>{item ? `Cancel ${item.name}?` : 'Cancel this entire order?'}</h3>
    <p id={`cancel-description-${orderId}`}>{item ? `This cancels all ${item.quantity} purchased units of ${item.name}. Other active products remain in your order.` : 'This cancels all remaining items from every seller. No payment will be due.'} Items will not be added back to your cart.</p>
    <p className="order-help">{item ? 'Cancellation is available only before this seller confirms.' : 'Cancellation is available only before any remaining seller confirms.'}</p>
    {error && <p className="order-error" role="alert">{error} Refresh orders to check the latest status before trying again.</p>}
    {saving && <p role="status">Cancelling your order…</p>}
    <div className="order-address-actions">
      <button type="button" autoFocus disabled={saving} onClick={onClose}>{error ? 'Refresh orders' : item ? 'Keep product' : 'Keep order'}</button>
      <button type="button" className="order-cancel-button" disabled={saving || Boolean(error)} onClick={() => void cancelOrder()}>
        {saving ? 'Cancelling…' : item ? 'Yes, cancel product' : 'Yes, cancel entire order'}
      </button>
    </div>
  </dialog>
}
