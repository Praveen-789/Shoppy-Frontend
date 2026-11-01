import { useEffect, useRef, useState } from 'react'
import { Star } from 'lucide-react'
import { getMyReview } from '../reviewApi'
import type { Review } from '../reviewApi'
import { Button } from './ui/button'
import ReviewEditor from './ReviewEditor'
import './Reviews.css'

export default function OrderItemReview({ productId, productName }: { productId: string; productName: string }) {
  const [checking, setChecking] = useState(false)
  const [editor, setEditor] = useState<{ review?: Review } | null>(null)
  const [reviewed, setReviewed] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const trigger = useRef<HTMLButtonElement>(null)
  const pending = useRef<AbortController | null>(null)
  useEffect(() => () => pending.current?.abort(), [])

  async function openReview() {
    if (pending.current) return
    const controller = new AbortController()
    pending.current = controller
    setChecking(true)
    setError('')
    setNotice('')
    try {
      // Check on each opening: the same product may appear in several orders,
      // but each customer has only one review for that product.
      const mine = await getMyReview(productId, controller.signal)
      if (controller.signal.aborted) return
      setReviewed(Boolean(mine.review))
      if (mine.review || mine.canReview) setEditor({ review: mine.review || undefined })
      else setError('Reviews are available after you receive this product. Refresh orders to check its delivery status.')
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load your review. Please try again.')
    } finally {
      if (!controller.signal.aborted) { pending.current = null; setChecking(false) }
    }
  }

  return <div className="order-item-review">
    <Button ref={trigger} variant="outline" size="sm" disabled={checking}
      aria-label={`${reviewed ? 'Edit review for' : 'Rate'} ${productName}`} onClick={() => void openReview()}>
      <Star aria-hidden="true" />{checking ? 'Checking review…' : reviewed ? 'Edit review' : 'Rate product'}
    </Button>
    {error && <p className="review-error" role="alert">{error}</p>}
    {notice && <p className="order-help" role="status">{notice}</p>}
    {editor && <ReviewEditor productId={productId} productName={productName} review={editor.review} deleting={false}
      onClose={() => setEditor(null)}
      onSaved={message => { setEditor(null); setReviewed(true); setNotice(message) }}
      onReturnFocus={() => trigger.current?.focus()} />}
  </div>
}
