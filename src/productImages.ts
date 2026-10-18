export interface ProductImage { _id: string; url: string }
export interface PendingImage { id: string; file: File; preview: string }
export const MAX_PRODUCT_IMAGES = 5

export function productImages(product?: { image: string; images?: ProductImage[] }): ProductImage[] {
  if (product?.images?.length) return product.images
  return product?.image ? [{ _id: 'legacy', url: product.image }] : []
}

export function validateImageSelection(currentCount: number, files: File[]) {
  if (currentCount + files.length > MAX_PRODUCT_IMAGES) return 'A product can have up to 5 photos. Remove a photo before adding more.'
  if (files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024 || file.size === 0)) {
    return 'Choose JPEG, PNG or WebP photos, each up to 5 MB.'
  }
  return ''
}
