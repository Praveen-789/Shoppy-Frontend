import { create } from 'zustand'

export interface CartProduct {
  _id: string
  name: string
  price: number
  image: string
  stock: number
  vendor?: { _id: string; name: string } | null
}
export interface CartItem extends CartProduct {
  cartItemId: string
  quantity: number
}
interface CartState {
  ownerId: string | null
  carts: Record<string, CartItem[]>
  busy: boolean
  refreshing: boolean
  error: string
  setSession: (userId: string | null) => void
  loadCart: (userId: string) => Promise<boolean>
  addItem: (userId: string, product: CartProduct) => Promise<boolean>
  setQuantity: (userId: string, itemId: string, quantity: number) => Promise<boolean>
  removeItem: (userId: string, itemId: string) => Promise<boolean>
  clearCart: (userId: string) => Promise<boolean>
}
export const EMPTY_CART: CartItem[] = []
// A new session invalidates responses still travelling from the previous session.
let sessionVersion = 0
export const useCartStore = create<CartState>((set, get) => {
  let latestRequest = 0
  async function request(userId: string, path = '', method = 'GET', body?: object) {
    const reading = method === 'GET'
    if (get().ownerId !== userId || get().busy || (reading && get().refreshing)) return false
    // A click takes priority over a background read. Its older response is ignored.
    const requestId = ++latestRequest
    const version = sessionVersion
    set({ busy: !reading, refreshing: reading, error: '' })
    try {
      const response = await fetch(`/api/cart${path}`, {
        method, credentials: 'include',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = await response.json()
      if (version !== sessionVersion || requestId !== latestRequest) return false
      if (!response.ok) throw new Error(data.message || 'Could not update your cart.')
      if (data.userId !== userId) throw new Error('Your session changed. Refresh the page to continue.')
      // MongoDB is the saved cart; Zustand holds the latest successful response.
      set({ carts: { [userId]: data.items } })
      return true
    } catch (error) {
      if (version === sessionVersion && requestId === latestRequest) set({ error: error instanceof Error ? error.message : 'Could not reach the cart server.' })
      return false
    } finally {
      if (version === sessionVersion && requestId === latestRequest) set({ busy: false, refreshing: false })
    }
  }
  return {
    ownerId: null, carts: {}, busy: false, refreshing: false, error: '',
    setSession: userId => {
      sessionVersion++
      set({ ownerId: userId, carts: {}, busy: false, refreshing: false, error: '' })
      if (userId) void request(userId)
    },
    loadCart: userId => request(userId),
    addItem: (userId, product) => request(userId, '/items', 'POST', { productId: product._id }),
    setQuantity: (userId, itemId, quantity) => {
      if (!Number.isSafeInteger(quantity) || quantity < 1) return Promise.resolve(false)
      return request(userId, `/items/${itemId}`, 'PATCH', { quantity })
    },
    removeItem: (userId, itemId) => request(userId, `/items/${itemId}`, 'DELETE'),
    clearCart: userId => request(userId, '', 'DELETE'),
  }
})
