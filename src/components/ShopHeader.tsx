import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { useCartStore } from '../stores/cartStore'
import ThemeToggle from './ThemeToggle'
import './Products.css'
import './Cart.css'

export default function ShopHeader({ disabled = false }: { disabled?: boolean }) {
  const { user, logout, busy } = useAuth()
  const count = useCartStore(state => user ? (state.carts[user.id] || []).reduce((sum, item) => sum + item.quantity, 0) : 0)
  if (!user) return null
  return <header className="shop-header">
    <Link className="shop-brand" to="/shop">shoppy<span>.</span></Link>
    <div className="shop-account">
      <span>Hello, {user.name}</span>
      <nav aria-label="Main navigation"><NavLink to="/shop">Shop</NavLink><NavLink to="/cart">Cart ({count})</NavLink><NavLink to="/orders">My orders</NavLink>{user.role === 'vendor' && <NavLink to="/vendor">My products</NavLink>}</nav>
      <button onClick={logout} disabled={disabled || busy}>{busy ? 'Signing out...' : 'Sign out'}</button><ThemeToggle />
    </div>
  </header>
}
