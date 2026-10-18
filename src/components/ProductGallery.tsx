import { useState } from 'react'
import type { Product } from '../productTypes'
import { productImages } from '../productImages'

export default function ProductGallery({ product }: { product: Product }) {
  const images = productImages(product)
  const [selectedId, setSelectedId] = useState('')
  const [failedUrls, setFailedUrls] = useState<string[]>([])
  const selected = images.find(image => image._id === selectedId) || images[0]
  return <div className="details-gallery">
    <div className="details-image">
      {selected && !failedUrls.includes(selected.url)
        ? <img src={selected.url} alt={`${product.name} — photo ${images.indexOf(selected) + 1}`} onError={() => setFailedUrls(current => [...current, selected.url])} />
        : <><span className="product-placeholder" aria-hidden="true">{product.name.charAt(0)}</span><p>Image unavailable</p></>}
    </div>
    {images.length > 1 && <>
      <p className="details-photo-count" aria-live="polite">Photo {images.indexOf(selected) + 1} of {images.length}</p>
      <div className="details-thumbnails" role="group" aria-label="Product photos">{images.map((image, index) =>
        <button type="button" key={image._id} aria-label={`View photo ${index + 1} of ${product.name}`} aria-pressed={image._id === selected._id} onClick={() => setSelectedId(image._id)}>
          {failedUrls.includes(image.url) ? <span>{index + 1}</span> : <img src={image.url} alt="" loading="lazy" onError={() => setFailedUrls(current => [...current, image.url])} />}
        </button>)}</div>
    </>}
  </div>
}
