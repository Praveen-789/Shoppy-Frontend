import type { ProductAttributes } from './categoryApi'
import type { ProductImage } from './productImages'

export interface VendorProduct {
  _id: string
  name: string
  description: string
  price: number
  category: string
  attributes?: ProductAttributes
  stock: number
  image: string
  images?: ProductImage[]
  status: 'draft' | 'published'
}
export type ProductDetails = Pick<VendorProduct, 'name' | 'description' | 'price' | 'category' | 'stock' | 'status' | 'attributes'>

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/vendor/products${path}`, { ...options, credentials: 'include' })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'The request failed. Please try again.')
  return data
}

export function listVendorProducts(page: number, signal: AbortSignal) {
  return request<{ products: VendorProduct[]; pagination: { page: number; total: number; hasMore: boolean } }>(`?page=${page}`, { signal })
}

export function saveVendorProduct(id: string | undefined, details: ProductDetails) {
  return request<{ product: VendorProduct }>(id ? `/${id}` : '', {
    method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(details),
  })
}

export function generateVendorDescription(input: { name: string; category: string; facts: string }, signal: AbortSignal) {
  return request<{ description: string }>('/generate-description', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal,
  })
}

export function uploadVendorImage(id: string, image: File) {
  return request<{ product: VendorProduct }>(`/${id}/image`, {
    method: 'POST', headers: { 'Content-Type': image.type }, body: image,
  })
}

export function addVendorImage(id: string, image: File, uploadKey: string) {
  return request<{ product: VendorProduct }>(`/${id}/images`, {
    method: 'POST', headers: { 'Content-Type': image.type, 'X-Upload-Key': uploadKey }, body: image,
  })
}

export function removeVendorImage(id: string, imageId: string) {
  return request<{ product: VendorProduct }>(`/${id}/images/${imageId}`, { method: 'DELETE' })
}

export function setVendorCover(id: string, imageId: string) {
  return request<{ product: VendorProduct }>(`/${id}/images/${imageId}/cover`, { method: 'PATCH' })
}
