import type { CartProduct } from './stores/cartStore'
import type { ProductImage } from './productImages'

export interface Product extends CartProduct {
  description: string
  category: string
  images?: ProductImage[]
}
