import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'
import { addressFields } from './addressFields'
import type { DeliveryAddress } from './addressFields'

interface Props {
  orderId: string
  initialAddress: DeliveryAddress
  onSaved: (address: DeliveryAddress) => void
  onCancel: () => void
}
export default function OrderAddressEditor({ orderId, initialAddress, onSaved, onCancel }: Props) {
  const [address, setAddress] = useState(initialAddress)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [locked, setLocked] = useState(false)
  const request = useRef<AbortController | null>(null)
  useEffect(() => () => request.current?.abort(), [])
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (request.current || locked) return
    const controller = new AbortController()
    request.current = controller
    setSaving(true)
    setError('')
    try {
      const response = await fetch(`/api/orders/${orderId}/address`, {
        method: 'PATCH', credentials: 'include', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address }),
      })
      const data = await response.json()
      if (controller.signal.aborted) return
      if (!response.ok) {
        if (response.status === 409 || response.status === 404) setLocked(true)
        throw new Error(data.message || 'Could not update your address. Please try again.')
      }
      toast.success('Delivery address updated.')
      onSaved(data.order.address)
    } catch (error) {
      if (!controller.signal.aborted) {
        const message = error instanceof Error ? error.message : 'Could not reach the server. Please try again.'
        setError(message)
        toast.error('Could not update your address', { description: message })
      }
    } finally {
      if (!controller.signal.aborted) {
        request.current = null
        setSaving(false)
      }
    }
  }
  return <form className="checkout-address order-address-editor" onSubmit={save} aria-label="Edit delivery address">
    <fieldset disabled={saving || locked}>
      {addressFields.map(field => {
        const id = `order-${orderId}-${field.key}`
        return <label key={field.key} htmlFor={id}>{field.label}
          <input id={id} name={field.key} required={field.key !== 'line2'} maxLength={field.max} autoComplete={field.auto}
            inputMode={field.key === 'phone' || field.key === 'postalCode' ? 'numeric' : 'text'}
            pattern={'pattern' in field ? field.pattern : undefined} value={address[field.key]}
            onChange={event => setAddress(current => ({ ...current, [field.key]: event.target.value }))} />
        </label>
      })}
    </fieldset>
    {error && <p className="order-error" role="alert">{error}</p>}
    <div className="order-address-actions">
      <button type="submit" disabled={saving || locked}>{saving ? 'Saving…' : 'Save address'}</button>
      <button type="button" disabled={saving} onClick={onCancel}>Cancel</button>
    </div>
  </form>
}
