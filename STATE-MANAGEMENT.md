# Learning the server-backed cart

Authentication belongs to Auth Context. Zustand holds the cart currently displayed
by React. MongoDB stores the saved cart for each account.

## Follow one Add to cart click

1. Products selects addItem from useCartStore.
2. The button awaits addItem(user.id, product).
3. The action sets busy and sends POST /api/cart/items with only productId.
4. Authentication middleware identifies the account from its HTTP-only cookie.
5. The service checks the published product and stock, then saves the cart row.
6. The API returns the cart with current product prices and stock.
7. Zustand calls set with the returned items. Cart and ShopHeader rerender.

The screen updates only after success. A failed request leaves the previous items
visible and sets an error. The busy flag prevents overlapping writes in this tab. Background reads use a separate refreshing flag, so a focus refresh cannot swallow a quantity click. A newer write invalidates older read responses;
the backend also uses a unique user/product index and atomic increments.

## Login, logout and other devices

AuthProvider calls setSession after session restoration, login, registration and
successful logout. That clears the old in-memory cart and loads the new account's
saved cart. A session version prevents old responses from overwriting a newer session.

Cart fetches again when opened, when its browser window regains focus, or when you
click Refresh availability. Other devices see saved changes on their next fetch;
there is no real-time push connection.

Cart persistence no longer uses localStorage. Previous shoppy-carts browser records
are left untouched but are not imported automatically. Add those items again to save
them to your account.

## Where to read

- src/stores/cartStore.ts: state, selectors and async actions.
- src/auth/AuthProvider.tsx: connecting authentication to the cart session.
- src/components/Products.tsx: adding a product.
- src/components/Cart.tsx: quantities, removal, refresh and subtotal.
- src/components/ShopHeader.tsx: subscribed cart count.
- ../shoppy-node/routes/cart.js: authenticated endpoints.
- ../shoppy-node/controllers/cartController.js: input validation.
- ../shoppy-node/services/cartService.js: database operations and stock checks.
- ../shoppy-node/models/CartItem.js: one product/quantity row per account.

A selector such as state => state.carts[userId] || EMPTY_CART subscribes a component
to its items. EMPTY_CART is a stable fallback array. Subtotal is calculated from
items, rather than stored separately.

Unavailable products remain removable. Stock reductions are shown without silently
changing the saved quantity. Carts do not reserve stock; future checkout must validate
prices and quantities again.

## Routes and checks

BrowserRouter provides /login, /shop, /cart and /vendor. ProtectedRoute waits for
authentication and restricts vendor pages. The backend enforces access independently.
Production hosting needs an index.html fallback for frontend routes, with /api routed
to the backend.

Run npm run test:cart in each project. Frontend checks also include npm run build and
npm run lint. Backend tests create temporary accounts/products and clean up their data.
