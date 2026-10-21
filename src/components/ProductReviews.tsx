import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { useRequireSignIn } from '../auth/useRequireSignIn'
import { getMyReview, getReviews } from '../reviewApi'
import type { MyReview, Review, ReviewPage } from '../reviewApi'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import RatingStars from './RatingStars'
import ReviewEditor from './ReviewEditor'
import './Reviews.css'

export default function ProductReviews(props: { productId: string; productName: string }) {
  const { user, checkingSession } = useAuth()
  // Remount on account changes so an old account's responses/form cannot leak.
  return <ReviewsContent key={`${props.productId}:${user?.id || 'guest'}:${checkingSession}`} {...props} signedIn={Boolean(user)} checkingSession={checkingSession} />
}

function ReviewCard({ review, own = false, children }: { review: Review; own?: boolean; children?: React.ReactNode }) {
  return <Card className="gap-3 py-4">
    <CardContent className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong>{own ? 'Your review' : review.reviewer.name}</strong>
        <time className="text-xs text-muted-foreground" dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</time>
      </div>
      <RatingStars rating={review.rating} />
      {review.comment && <p className="m-0 whitespace-pre-wrap leading-relaxed">{review.comment}</p>}
      {children}
    </CardContent>
  </Card>
}

function ReviewsContent({ productId, productName, signedIn, checkingSession }: {
  productId: string; productName: string; signedIn: boolean; checkingSession: boolean
}) {
  const { requireSignIn } = useRequireSignIn()
  const [page, setPage] = useState(1)
  const [refresh, setRefresh] = useState(0)
  const [data, setData] = useState<ReviewPage | null>(null)
  const [mine, setMine] = useState<MyReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [accountLoading, setAccountLoading] = useState(signedIn)
  const [error, setError] = useState('')
  const [accountError, setAccountError] = useState('')
  const [notice, setNotice] = useState('')
  const [dialog, setDialog] = useState<'create' | 'edit' | 'delete' | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError('')
      try {
        const result = await getReviews(productId, page, controller.signal)
        if (!controller.signal.aborted) setData(result)
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load reviews.')
      } finally { if (!controller.signal.aborted) setLoading(false) }
    }
    void load()
    return () => controller.abort()
  }, [productId, page, refresh])

  useEffect(() => {
    if (!signedIn || checkingSession) return
    const controller = new AbortController()
    async function loadAccount() {
      setAccountLoading(true)
      setAccountError('')
      try {
        const result = await getMyReview(productId, controller.signal)
        if (!controller.signal.aborted) setMine(result)
      } catch (error) {
        if (!controller.signal.aborted) setAccountError(error instanceof Error ? error.message : 'Could not check review eligibility.')
      } finally { if (!controller.signal.aborted) setAccountLoading(false) }
    }
    void loadAccount()
    return () => controller.abort()
  }, [productId, signedIn, checkingSession, refresh])

  function openDialog(mode: 'create' | 'edit' | 'delete') {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setDialog(mode)
  }
  function reload() { setRefresh(value => value + 1) }

  return <section className="product-reviews" aria-labelledby={`reviews-${productId}`}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id={`reviews-${productId}`} tabIndex={-1} className="m-0 text-2xl font-semibold">Ratings &amp; reviews</h2>
      <Button variant="outline" size="sm" disabled={loading || accountLoading || checkingSession} onClick={reload}>Refresh reviews</Button>
    </div>
    {notice && <p role="status" className="review-notice">{notice}</p>}
    {data && <div className="review-summary">
      <strong className="text-4xl">{data.summary.count ? data.summary.average.toFixed(1) : '—'}</strong>
      <div><RatingStars rating={data.summary.average} /><p className="m-0 mt-1 text-sm text-muted-foreground">{data.summary.count ? `${data.summary.count} ${data.summary.count === 1 ? 'review' : 'reviews'}` : 'No reviews yet'}</p></div>
    </div>}
    <div className="review-account">
      {checkingSession || accountLoading ? <p role="status">Checking your review eligibility…</p> : accountError ?
        <div role="alert"><p>{accountError}</p><Button variant="outline" onClick={reload}>Retry eligibility check</Button></div> : !signedIn ?
          <><p>Have you purchased this product? Sign in to share your experience after delivery.</p><Button variant="outline" onClick={requireSignIn}>Sign in to review</Button></> : mine?.review ?
            <ReviewCard review={mine.review} own><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => openDialog('edit')}>Edit review</Button><Button size="sm" variant="ghost" onClick={() => openDialog('delete')}>Delete review</Button></div></ReviewCard> : mine?.canReview ?
              <><p>Your purchase was delivered. Tell other shoppers what you think.</p><Button onClick={() => openDialog('create')}>Write a review</Button></> :
              <p className="text-sm text-muted-foreground">Reviews are available after you receive this product.</p>}
    </div>
    <div aria-busy={loading} className="space-y-4">
      {loading ? <p role="status">Loading reviews…</p> : error ? <div role="alert"><p>{error}</p><Button variant="outline" onClick={reload}>Try again</Button></div> : data && <>
        {data.reviews.length === 0 && <p className="text-muted-foreground">{page === 1 ? 'No reviews yet. Your experience could help the next shopper.' : 'No reviews on this page.'}</p>}
        {data.reviews.filter(review => review._id !== mine?.review?._id).map(review => <ReviewCard key={review._id} review={review} />)}
        {(page > 1 || data.pagination.hasMore) && <nav aria-label="Review pages" className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(value => value - 1)}>Previous</Button>
          <span className="text-sm">Page {page}</span>
          <Button variant="outline" disabled={!data.pagination.hasMore} onClick={() => setPage(value => value + 1)}>Next</Button>
        </nav>}
      </>}
    </div>
    {dialog && <ReviewEditor productId={productId} productName={productName} review={dialog === 'create' ? undefined : mine?.review || undefined} deleting={dialog === 'delete'}
      onClose={() => setDialog(null)} onSaved={message => { setDialog(null); setNotice(message); setPage(1); reload() }}
      onReturnFocus={() => { const target = returnFocus.current; if (target?.isConnected) target.focus(); else document.getElementById(`reviews-${productId}`)?.focus() }} />}
  </section>
}
