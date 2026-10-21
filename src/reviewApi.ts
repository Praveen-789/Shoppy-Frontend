export interface Review {
  _id: string
  rating: number
  comment: string
  reviewer: { name: string }
  createdAt: string
  updatedAt: string
}
export interface ReviewInput { rating: number; comment: string }
export interface ReviewSummary { count: number; average: number }
export interface ReviewPage {
  reviews: Review[]
  summary: ReviewSummary
  pagination: { page: number; limit: number; hasMore: boolean }
}
export interface MyReview { review: Review | null; canReview: boolean }

async function request<T>(path: string, signal: AbortSignal, method = 'GET', input?: ReviewInput): Promise<T> {
  const response = await fetch(path, {
    method, signal, credentials: 'include',
    ...(input ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) } : {}),
  })
  if (response.status === 204) return undefined as T
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Could not update reviews. Please try again.')
  return data as T
}

const productPath = (id: string) => `/api/products/${encodeURIComponent(id)}/reviews`
export const getReviews = (id: string, page: number, signal: AbortSignal) => request<ReviewPage>(`${productPath(id)}?page=${page}`, signal)
export const getMyReview = (id: string, signal: AbortSignal) => request<MyReview>(`${productPath(id)}/mine`, signal)
export const saveReview = (productId: string, reviewId: string | undefined, input: ReviewInput, signal: AbortSignal) =>
  request<{ review: Review }>(reviewId ? `/api/reviews/${encodeURIComponent(reviewId)}` : productPath(productId), signal, reviewId ? 'PATCH' : 'POST', input)
export const deleteReview = (id: string, signal: AbortSignal) => request<void>(`/api/reviews/${encodeURIComponent(id)}`, signal, 'DELETE')
