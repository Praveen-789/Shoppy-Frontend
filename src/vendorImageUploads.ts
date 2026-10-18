import type { PendingImage } from './productImages'
import type { VendorProduct } from './vendorApi'
import { addVendorImage } from './vendorApi'

// Commit each successful photo separately so a later failure leaves only the
// remaining files queued. The stable queue ID makes network retries idempotent.
export async function uploadPendingImages(
  product: VendorProduct,
  pending: PendingImage[],
  onUploaded: (image: PendingImage, product: VendorProduct) => void,
  onProgress: (index: number, total: number) => void,
) {
  let saved = product
  for (const [index, image] of pending.entries()) {
    onProgress(index + 1, pending.length)
    saved = (await addVendorImage(saved._id, image.file, image.id)).product
    onUploaded(image, saved)
  }
  return saved
}
