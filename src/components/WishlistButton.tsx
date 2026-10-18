import { useRequireSignIn } from '../auth/useRequireSignIn'
import { useAuth } from '../auth/useAuth'
import { EMPTY_WISHLIST, useWishlistStore } from '../stores/wishlistStore'
import type { WishlistProduct } from '../stores/wishlistStore'
export default function WishlistButton({ product }: { product: WishlistProduct }) {
  const { requireSignIn } = useRequireSignIn()
  const { user, checkingSession } = useAuth()
  const items = useWishlistStore(state => user ? state.wishlists[user.id] || EMPTY_WISHLIST : EMPTY_WISHLIST)
  const busy = useWishlistStore(state => state.busy)
  const refreshing = useWishlistStore(state => state.refreshing)
  const addItem = useWishlistStore(state => state.addItem)
  const removeItem = useWishlistStore(state => state.removeItem)
  const saved = items.find(item => item._id === product._id)
  return <div className="wishlist-control"><button aria-pressed={Boolean(saved)} aria-label={`${saved ? 'Remove' : 'Save'} ${product.name} ${saved ? 'from' : 'to'} wishlist`} disabled={checkingSession || busy || refreshing}
    onClick={() => {
      if (!user) { requireSignIn(); return }
      void (saved ? removeItem(user.id, saved.wishlistItemId) : addItem(user.id, product))
    }}>{saved ? 'Saved to wishlist' : 'Save to wishlist'}</button>
  </div>
}
