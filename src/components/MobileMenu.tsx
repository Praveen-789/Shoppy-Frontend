import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Dialog } from 'radix-ui'
import { Menu, X } from 'lucide-react'
import { headerLinksFor } from '../headerLinks'
import ThemeToggle from './ThemeToggle'
import './MobileMenu.css'

interface Props {
  name?: string
  isVendor: boolean
  cartCount: number
  busy: boolean
  disabled: boolean
  onLogout: () => void
}

// A slide-in side menu for small screens. Radix Dialog gives us the hard parts for free:
// a focus trap, Escape to close, click outside to close, and body scroll locking while open.
export default function MobileMenu({ name, isVendor, cartCount, busy, disabled, onLogout }: Props) {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const links = headerLinksFor(isVendor)

  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger asChild>
      <button type="button" className="mobile-menu-button" aria-label="Open menu"><Menu aria-hidden="true" /></button>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="mobile-menu-overlay" />
      <Dialog.Content className="mobile-menu" aria-describedby={undefined}>
        <div className="mobile-menu-top">
          <Dialog.Title className="mobile-menu-title">{name ? `Hello, ${name}` : 'Welcome to Shoppy'}</Dialog.Title>
          <Dialog.Close asChild>
            <button type="button" className="mobile-menu-close" aria-label="Close menu"><X aria-hidden="true" /></button>
          </Dialog.Close>
        </div>
        <nav className="mobile-menu-links" aria-label="Main navigation">
          {/* Each link closes the drawer so the page behind it is visible as soon as the route changes. */}
          {links.map(({ to, label, Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}>
            <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
            <span>{label}</span>
            {to === '/cart' && cartCount > 0 && <span className="mobile-menu-count">{cartCount}</span>}
          </NavLink>)}
        </nav>
        <div className="mobile-menu-bottom">
          <div className="mobile-menu-theme"><span>Theme</span><ThemeToggle /></div>
          {name ? <button type="button" className="mobile-menu-signout" onClick={onLogout} disabled={disabled || busy}>{busy ? 'Signing out...' : 'Sign out'}</button> : <Link className="mobile-menu-signout" to="/login" state={{ from: location.pathname }} onClick={() => setOpen(false)}>Sign in</Link>}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}
