import { Heart } from 'lucide-react'
import { useRequireSignIn } from '../auth/useRequireSignIn'
import { useAuth } from '../auth/useAuth'
import { EMPTY_WISHLIST, useWishlistStore } from '../stores/wishlistStore'
import type { WishlistProduct } from '../stores/wishlistStore'

interface Props {
  product: WishlistProduct
  // 'text' is the full-width button used on the details page. 'icon' is the small heart that sits
  // in the corner of a catalog card image, so Add to cart can be the only big button on a card.
  variant?: 'text' | 'icon'
}

export default function WishlistButton({ product, variant = 'text' }: Props) {
  const { requireSignIn } = useRequireSignIn()
  const { user, checkingSession } = useAuth()
  const items = useWishlistStore(state => user ? state.wishlists[user.id] || EMPTY_WISHLIST : EMPTY_WISHLIST)
  const busy = useWishlistStore(state => state.busy)
  const refreshing = useWishlistStore(state => state.refreshing)
  const addItem = useWishlistStore(state => state.addItem)
  const removeItem = useWishlistStore(state => state.removeItem)
  const saved = items.find(item => item._id === product._id)

  function toggle() {
    if (!user) { requireSignIn(); return }
    void (saved ? removeItem(user.id, saved.wishlistItemId) : addItem(user.id, product))
  }

  const label = `${saved ? 'Remove' : 'Save'} ${product.name} ${saved ? 'from' : 'to'} wishlist`
  const disabled = checkingSession || busy || refreshing

  if (variant === 'icon') {
    return <button type="button" className="wishlist-heart" aria-pressed={Boolean(saved)} aria-label={label} title={saved ? 'Saved to wishlist' : 'Save to wishlist'} disabled={disabled} onClick={toggle}>
      <Heart aria-hidden="true" strokeWidth={1.8} fill={saved ? 'currentColor' : 'none'} />
    </button>
  }

  return <div className="wishlist-control">
    <button aria-pressed={Boolean(saved)} aria-label={label} disabled={disabled} onClick={toggle}>{saved ? 'Saved to wishlist' : 'Save to wishlist'}</button>
  </div>
}
