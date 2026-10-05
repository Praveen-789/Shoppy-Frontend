export interface VendorProduct {
  _id: string
  name: string
  description: string
  price: number
  category: string
  stock: number
  image: string
  status: 'draft' | 'published'
}
export type ProductDetails = Pick<VendorProduct, 'name' | 'description' | 'price' | 'category' | 'stock' | 'status'>

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

export function uploadVendorImage(id: string, image: File) {
  return request<{ product: VendorProduct }>(`/${id}/image`, {
    method: 'POST', headers: { 'Content-Type': image.type }, body: image,
  })
}
