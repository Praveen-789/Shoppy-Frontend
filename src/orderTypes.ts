import type { DeliveryAddress } from './components/addressFields'

export const fulfilmentSteps = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'] as const
export type FulfilmentStatus = typeof fulfilmentSteps[number]
const statusLabels: Record<string, string> = {
  placed: 'Placed', confirmed: 'Confirmed', packed: 'Packed', shipped: 'Shipped',
  out_for_delivery: 'Out for delivery', delivered: 'Delivered',
  processing: 'In progress', partially_delivered: 'Partially delivered',
}
export function statusLabel(status: string) { return statusLabels[status] || status }
export function paymentLabel(status: string) {
  return status === 'collected' ? 'Cash collected' : status === 'partially_collected' ? 'Cash partly collected' : 'Payment pending'
}
export interface OrderItem { product: string; vendor: string; name: string; quantity: number; unitPricePaise: number }
export interface StatusEvent { status: FulfilmentStatus; at: string }
export interface VendorPortion {
  vendor: string
  vendorName: string
  subtotalPaise: number
  status: FulfilmentStatus
  paymentStatus: string
  history: StatusEvent[]
}
export interface CustomerOrder {
  _id: string
  createdAt: string
  status: string
  paymentStatus: string
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
  subtotalPaise: number
  status: FulfilmentStatus
  paymentStatus: string
  history: StatusEvent[]
}
