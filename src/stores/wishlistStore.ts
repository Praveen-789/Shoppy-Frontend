import { create } from 'zustand'

export interface WishlistProduct {
  _id: string
  name: string
  price: number
  image: string
  stock: number
  vendor?: { _id: string; name: string } | null
}
export interface WishlistItem extends WishlistProduct {
  wishlistItemId: string
  available: boolean
}
interface WishlistState {
  ownerId: string | null
  wishlists: Record<string, WishlistItem[]>
  busy: boolean
  refreshing: boolean
  error: string
  setSession: (userId: string | null) => void
  loadWishlist: (userId: string) => Promise<boolean>
  addItem: (userId: string, product: WishlistProduct) => Promise<boolean>
  removeItem: (userId: string, itemId: string) => Promise<boolean>
}
export const EMPTY_WISHLIST: WishlistItem[] = []
// A new session invalidates responses still travelling from the previous session.
let sessionVersion = 0
export const useWishlistStore = create<WishlistState>((set, get) => {
  let latestRequest = 0
  async function request(userId: string, path = '', method = 'GET', body?: object) {
    const reading = method === 'GET'
    if (get().ownerId !== userId || get().busy || (reading && get().refreshing)) return false
    // A click takes priority over a background read. Its older response is ignored.
    const requestId = ++latestRequest
    const version = sessionVersion
    set({ busy: !reading, refreshing: reading, error: '' })
    try {
      const response = await fetch(`/api/wishlist${path}`, {
        method, credentials: 'include',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = await response.json()
      if (version !== sessionVersion || requestId !== latestRequest) return false
      if (!response.ok) throw new Error(data.message || 'Could not update your wishlist.')
      if (data.userId !== userId) throw new Error('Your session changed. Refresh the page to continue.')
      // MongoDB is the saved wishlist; Zustand holds the latest successful response.
      set({ wishlists: { [userId]: data.items } })
      return true
    } catch (error) {
      if (version === sessionVersion && requestId === latestRequest) set({ error: error instanceof Error ? error.message : 'Could not reach the wishlist server.' })
      return false
    } finally {
      if (version === sessionVersion && requestId === latestRequest) set({ busy: false, refreshing: false })
    }
  }
  return {
    ownerId: null, wishlists: {}, busy: false, refreshing: false, error: '',
    setSession: userId => {
      sessionVersion++
      set({ ownerId: userId, wishlists: {}, busy: false, refreshing: false, error: '' })
      if (userId) void request(userId)
    },
    loadWishlist: userId => request(userId),
    addItem: (userId, product) => request(userId, '/items', 'POST', { productId: product._id }),
    removeItem: (userId, itemId) => request(userId, `/items/${itemId}`, 'DELETE'),
  }
})
