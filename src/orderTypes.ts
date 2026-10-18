import type { DeliveryAddress } from './components/addressFields'

export const fulfilmentSteps = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'] as const
export type FulfilmentStatus = typeof fulfilmentSteps[number] | 'cancelled'
const statusLabels: Record<string, string> = {
  placed: 'Placed', confirmed: 'Confirmed', packed: 'Packed', shipped: 'Shipped',
  out_for_delivery: 'Out for delivery', delivered: 'Delivered',
  cancelled: 'Cancelled', processing: 'In progress', partially_delivered: 'Partially delivered',
}
export function statusLabel(status: string) { return statusLabels[status] || status }
export function paymentLabel(status: string) {
  if (status === 'not_required') return 'No payment due'
  return status === 'collected' ? 'Cash collected' : status === 'partially_collected' ? 'Cash partly collected' : 'Payment pending'
}
export interface OrderItem { product: string; vendor: string; name: string; quantity: number; unitPricePaise: number; status?: 'active' | 'cancelled'; cancelledAt?: string }
export interface StatusEvent { status: FulfilmentStatus; at: string }
export interface VendorPortion {
  vendor: string
  vendorName: string
  payablePaise?: number
  subtotalPaise: number
  status: FulfilmentStatus
  paymentStatus: string
  history: StatusEvent[]
}
export interface CustomerOrder {
  _id: string
  createdAt: string
  cancelledAt?: string
  status: string
  paymentStatus: string
  payablePaise?: number
  totalPaise: number
  address: DeliveryAddress
  items: OrderItem[]
  vendorOrders: VendorPortion[]
}
export interface VendorOrder {
  _id: string
  createdAt: string
  address: DeliveryAddress
  items: OrderItem[]
  payablePaise?: number
  subtotalPaise: number
  status: FulfilmentStatus
  paymentStatus: string
  history: StatusEvent[]
}

// Cancellation is terminal, never a step that can advance back to placed.
export function nextFulfilmentStatus(status: FulfilmentStatus) {
  if (status === 'cancelled') return undefined
  return fulfilmentSteps[fulfilmentSteps.indexOf(status) + 1]
}
export function canCancelOrder(order: CustomerOrder) {
  return order.status === 'placed' && order.paymentStatus === 'pending' &&
    order.vendorOrders.every(portion => portion.status === 'cancelled' || (portion.status === 'placed' && portion.paymentStatus === 'pending'))
}

export function canCancelItem(order: CustomerOrder, item: OrderItem) {
  const seller = order.vendorOrders.find(portion => portion.vendor === item.vendor)
  return order.status !== 'cancelled' && item.status !== 'cancelled' &&
    seller?.status === 'placed' && seller.paymentStatus === 'pending'
}
export function payableAmount(order: { status: string; payablePaise?: number; totalPaise?: number; subtotalPaise?: number }) {
  return order.status === 'cancelled' ? 0 : (order.payablePaise ?? order.totalPaise ?? order.subtotalPaise ?? 0)
}
