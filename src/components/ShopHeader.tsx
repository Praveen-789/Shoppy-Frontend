import { Link, NavLink, useLocation } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { useCartStore } from '../stores/cartStore'
import ThemeToggle from './ThemeToggle'
import MobileMenu from './MobileMenu'
import { headerLinksFor } from '../headerLinks'
import './Products.css'
import './Cart.css'

export default function ShopHeader({ disabled = false }: { disabled?: boolean }) {
  const location = useLocation()
  const { user, logout, busy } = useAuth()
  const count = useCartStore(state => user ? (state.carts[user.id] || []).reduce((sum, item) => sum + item.quantity, 0) : 0)
  const isVendor = user?.role === 'vendor'
  const links = headerLinksFor(isVendor)
  return <header className="shop-header">
    <Link className="shop-brand" to="/shop">shoppy<span>.</span></Link>
    {/* Wide screens: every link in a row. MobileMenu.css drops the greeting below 1300px and hides this block below 1100px. */}
    <div className="shop-account">
      <span>{user ? `Hello, ${user.name}` : 'Welcome to Shoppy'}</span>
      <nav aria-label="Main navigation">{links.map(({ to, label, end }) => <NavLink key={to} to={to} end={end}>{to === '/cart' ? `Cart (${count})` : label}</NavLink>)}</nav>
      {user ? <button onClick={logout} disabled={disabled || busy}>{busy ? 'Signing out...' : 'Sign out'}</button> : <Link to="/login" state={{ from: location.pathname }}>Sign in</Link>}<ThemeToggle />
    </div>
    {/* Small screens: a cart shortcut with a badge, and a menu button that opens the side drawer. */}
    <div className="shop-mobile-actions">
      <Link className="mobile-cart-link" to="/cart" aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}>
        <ShoppingCart aria-hidden="true" strokeWidth={1.8} />
        {count > 0 && <span className="mobile-cart-badge" aria-hidden="true">{count > 99 ? '99+' : count}</span>}
      </Link>
      <MobileMenu name={user?.name} isVendor={isVendor} cartCount={count} busy={busy} disabled={disabled} onLogout={logout} />
    </div>
  </header>
}
