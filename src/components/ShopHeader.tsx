import { Link, NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, LogOut, ShoppingCart } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { useCartStore } from '../stores/cartStore'
import { useWishlistStore } from '../stores/wishlistStore'
import ThemeToggle from './ThemeToggle'
import MobileMenu from './MobileMenu'
import { headerLinksFor } from '../headerLinks'
import { Button } from './ui/button'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from './ui/dropdown-menu'
import './Products.css'
import './ShopHeader.css'

// "Praveen Kumar" becomes "PK" for the avatar circle.
function initialsOf(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('') || '?'
}

export default function ShopHeader({ disabled = false }: { disabled?: boolean }) {
  const location = useLocation()
  const { user, logout, busy } = useAuth()
  const count = useCartStore(state => user ? (state.carts[user.id] || []).reduce((sum, item) => sum + item.quantity, 0) : 0)
  const savedCount = useWishlistStore(state => user ? (state.wishlists[user.id] || []).length : 0)
  const isVendor = user?.role === 'vendor'
  const links = headerLinksFor(isVendor)
  const navLinks = links.filter(link => !link.iconOnly)
  const iconLinks = links.filter(link => link.iconOnly)
  const badgeFor = (to: string) => to === '/cart' ? count : to === '/wishlist' ? savedCount : 0

  return <header className="shop-header">
    <Link className="shop-brand" to="/shop">shoppy<span>.</span></Link>
    {/* Wide screens: text links for pages, icon buttons for cart and wishlist, then the account menu.
        ShopHeader.css hides this below 980px, where the drawer in MobileMenu takes over. */}
    <nav className="shop-nav" aria-label="Main navigation">
      {navLinks.map(({ to, label, end }) => <NavLink key={to} to={to} end={end}>{label}</NavLink>)}
    </nav>
    <div className="shop-account">
      {iconLinks.map(({ to, label, Icon }) => {
        const badge = badgeFor(to)
        return <Tooltip key={to}>
          <TooltipTrigger asChild>
            <Button asChild variant="ghost" size="icon" className="shop-icon-link">
              <NavLink to={to} aria-label={badge > 0 ? `${label}, ${badge} ${badge === 1 ? 'item' : 'items'}` : label}>
                <Icon aria-hidden="true" strokeWidth={1.8} className="size-5" />
                {badge > 0 && <span className="shop-icon-badge" aria-hidden="true">{badge > 99 ? '99+' : badge}</span>}
              </NavLink>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      })}
      <ThemeToggle />
      {user ? (
        // Radix DropdownMenu handles the keyboard: arrow keys move between items, Escape closes it.
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="shop-account-trigger" aria-label={`Account menu for ${user.name}`}>
              <Avatar size="sm"><AvatarFallback>{initialsOf(user.name)}</AvatarFallback></Avatar>
              <span className="shop-account-name">{user.name}</span>
              <ChevronDown aria-hidden="true" className="size-4 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="shop-account-menu">
            <DropdownMenuLabel>
              <span className="shop-account-menu-name">{user.name}</span>
              <span className="shop-account-menu-email">{user.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {links.filter(link => link.to !== '/shop').map(({ to, label, Icon }) => (
              <DropdownMenuItem key={to} asChild><Link to={to}><Icon aria-hidden="true" />{label}</Link></DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={disabled || busy} onSelect={logout}><LogOut aria-hidden="true" />{busy ? 'Signing out...' : 'Sign out'}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button asChild size="sm"><Link to="/login" state={{ from: location.pathname }}>Sign in</Link></Button>
      )}
    </div>
    {/* Small screens: a cart shortcut with a badge, and a menu button that opens the side drawer. */}
    <div className="shop-mobile-actions">
      <Link className="mobile-cart-link" to="/cart" aria-label={`Cart (${count} ${count === 1 ? 'item' : 'items'})`}>
        <ShoppingCart aria-hidden="true" strokeWidth={1.8} />
        {count > 0 && <span className="mobile-cart-badge" aria-hidden="true">{count > 99 ? '99+' : count}</span>}
      </Link>
      <MobileMenu name={user?.name} isVendor={isVendor} cartCount={count} busy={busy} disabled={disabled} onLogout={logout} />
    </div>
  </header>
}
