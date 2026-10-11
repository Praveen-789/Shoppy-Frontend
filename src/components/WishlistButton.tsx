import { useAuth } from '../auth/useAuth'
import { EMPTY_WISHLIST, useWishlistStore } from '../stores/wishlistStore'
import type { WishlistProduct } from '../stores/wishlistStore'
export default function WishlistButton({ product }: { product: WishlistProduct }) {
  const { user } = useAuth()
  const items = useWishlistStore(state => user ? state.wishlists[user.id] || EMPTY_WISHLIST : EMPTY_WISHLIST)
  const busy = useWishlistStore(state => state.busy)
  const refreshing = useWishlistStore(state => state.refreshing)
  const addItem = useWishlistStore(state => state.addItem)
  const removeItem = useWishlistStore(state => state.removeItem)
  const saved = items.find(item => item._id === product._id)
  if (!user) return null
  return <div className="wishlist-control"><button aria-pressed={Boolean(saved)} aria-label={`${saved ? 'Remove' : 'Save'} ${product.name} ${saved ? 'from' : 'to'} wishlist`} disabled={busy || refreshing}
    onClick={() => void (saved ? removeItem(user.id, saved.wishlistItemId) : addItem(user.id, product))}>{saved ? 'Saved to wishlist' : 'Save to wishlist'}</button>
  </div>
}
