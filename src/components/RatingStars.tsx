import { Star } from 'lucide-react'
import './Reviews.css'

export default function RatingStars({ rating }: { rating: number }) {
  return <span className="rating-stars" role="img" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map(value => <span className="rating-star" key={value} aria-hidden="true">
      <Star />
      <span className="rating-star-fill" style={{ width: `${Math.max(0, Math.min(1, rating - value + 1)) * 100}%` }}><Star /></span>
    </span>)}
  </span>
}
