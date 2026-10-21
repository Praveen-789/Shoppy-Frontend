import { useEffect, useId, useRef, useState } from 'react'
import { Dialog } from 'radix-ui'
import { Star, X } from 'lucide-react'
import { deleteReview, saveReview } from '../reviewApi'
import type { Review } from '../reviewApi'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'

interface Props {
  productId: string
  productName: string
  review?: Review
  deleting: boolean
  onClose: () => void
  onSaved: (message: string) => void
  onReturnFocus: () => void
}

const labels = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent']

export default function ReviewEditor({ productId, productName, review, deleting, onClose, onSaved, onReturnFocus }: Props) {
  const id = useId()
  const [rating, setRating] = useState(review?.rating || 0)
  const [comment, setComment] = useState(review?.comment || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef<AbortController | null>(null)
  useEffect(() => () => pending.current?.abort(), [])

  async function submit() {
    if (pending.current) return
    if (!deleting && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      setError('Choose a rating from 1 to 5 stars.')
      document.getElementById(`${id}-star-1`)?.focus()
      return
    }
    const controller = new AbortController()
    pending.current = controller
    setBusy(true)
    setError('')
    try {
      if (deleting && review) await deleteReview(review._id, controller.signal)
      else await saveReview(productId, review?._id, { rating, comment: comment.trim() }, controller.signal)
      if (!controller.signal.aborted) onSaved(deleting ? 'Your review was deleted.' : review ? 'Your review was updated.' : 'Thanks! Your review was published.')
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not save your review. Try again.')
    } finally {
      if (!controller.signal.aborted) { pending.current = null; setBusy(false) }
    }
  }

  return <Dialog.Root open onOpenChange={open => { if (!open && !pending.current) onClose() }}>
    <Dialog.Portal>
      <Dialog.Overlay className="review-overlay" />
      <Dialog.Content className="review-dialog" onCloseAutoFocus={event => { event.preventDefault(); onReturnFocus() }}
        onEscapeKeyDown={event => { if (pending.current) event.preventDefault() }}
        onInteractOutside={event => { if (pending.current) event.preventDefault() }}>
        <div className="flex items-center justify-between gap-3">
          <Dialog.Title className="m-0 text-2xl font-semibold">{deleting ? 'Delete your review?' : review ? 'Edit your review' : 'Write a review'}</Dialog.Title>
          <Dialog.Close asChild><Button variant="ghost" size="icon" disabled={busy} aria-label="Close review form"><X aria-hidden="true" /></Button></Dialog.Close>
        </div>
        <Dialog.Description className="text-sm text-muted-foreground">{deleting ? `Your rating and comment for ${productName} will be removed.` : `How was your experience with ${productName}?`}</Dialog.Description>
        <form noValidate onSubmit={event => { event.preventDefault(); void submit() }} aria-busy={busy}>
          {!deleting && <>
            <fieldset className="review-rating" disabled={busy} aria-describedby={error ? `${id}-error` : undefined}>
              <legend>Your rating (required)</legend>
              <div className="review-star-options">
                {labels.map((label, index) => <label className="review-star-option" key={label}>
                  <input id={`${id}-star-${index + 1}`} type="radio" name={`${id}-rating`} value={index + 1} checked={rating === index + 1}
                    aria-label={`${index + 1} ${index ? 'stars' : 'star'} — ${label}`} onChange={() => { setRating(index + 1); setError('') }} />
                  <Star aria-hidden="true" className={index < rating ? 'is-selected' : ''} />
                </label>)}
              </div>
              <p className="m-0 text-sm text-muted-foreground" aria-live="polite">{rating ? `${rating} of 5 — ${labels[rating - 1]}` : 'Select your stars'}</p>
            </fieldset>
            <label className="mb-2 block font-semibold" htmlFor={`${id}-comment`}>Your review <span className="font-normal text-muted-foreground">(optional)</span></label>
            <Textarea id={`${id}-comment`} rows={4} maxLength={1000} value={comment} disabled={busy} aria-describedby={`${id}-count`}
              placeholder="What did you like? What could be better?" onChange={event => setComment(event.target.value)} />
            <p id={`${id}-count`} className="mt-2 text-right text-xs text-muted-foreground">{comment.length} / 1,000 characters</p>
          </>}
          {error && <p id={`${id}-error`} className="review-error" role="alert">{error}</p>}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Dialog.Close asChild><Button type="button" variant="outline" disabled={busy}>{deleting ? 'Keep review' : 'Cancel'}</Button></Dialog.Close>
            <Button type="submit" variant={deleting ? 'destructive' : 'default'} disabled={busy}>{busy ? deleting ? 'Deleting…' : 'Saving…' : deleting ? 'Delete review' : review ? 'Save changes' : 'Submit review'}</Button>
          </div>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}
