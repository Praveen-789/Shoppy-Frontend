import { BarChart3, Heart, Inbox, Package, ShoppingBag, ShoppingCart, Store, type LucideIcon } from 'lucide-react'

// One entry per header link. The same list drives the wide-screen header in ShopHeader and the
// small-screen drawer in MobileMenu, so adding a page later only needs a new row here.
// `iconOnly` links (cart, wishlist) show as icon buttons with a count badge instead of text,
// which keeps the header short enough for a vendor's extra pages.
export interface HeaderLink { to: string; label: string; Icon: LucideIcon; end?: boolean; vendorOnly?: boolean; iconOnly?: boolean }

export const HEADER_LINKS: HeaderLink[] = [
  { to: '/shop', label: 'Shop', Icon: ShoppingBag },
  { to: '/orders', label: 'My orders', Icon: Package },
  { to: '/vendor', label: 'My products', Icon: Store, end: true, vendorOnly: true },
  { to: '/vendor/orders', label: 'Incoming orders', Icon: Inbox, vendorOnly: true },
  { to: '/vendor/sales', label: 'Sales', Icon: BarChart3, vendorOnly: true },
  { to: '/wishlist', label: 'Wishlist', Icon: Heart, iconOnly: true },
  { to: '/cart', label: 'Cart', Icon: ShoppingCart, iconOnly: true },
]

export function headerLinksFor(isVendor: boolean) {
  return HEADER_LINKS.filter(link => isVendor || !link.vendorOnly)
}
