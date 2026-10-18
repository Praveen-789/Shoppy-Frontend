import { ImagePlus, Star, Trash2, X } from 'lucide-react'
import type { PendingImage, ProductImage } from '../productImages'
import { MAX_PRODUCT_IMAGES } from '../productImages'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

interface Props {
  images: ProductImage[]
  pending: PendingImage[]
  busy: boolean
  error: string
  onSelect: (files: File[]) => void
  onDiscard: (id: string) => void
  onRemove: (id: string) => void
  onCover: (id: string) => void
}

export default function VendorProductImages({ images, pending, busy, error, onSelect, onDiscard, onRemove, onCover }: Props) {
  const count = images.length + pending.length
  const preview = images[0]?.url || pending[0]?.preview
  return <Card>
    <CardHeader><CardTitle><h3>Product photography <Badge variant="outline">{count}/{MAX_PRODUCT_IMAGES}</Badge></h3></CardTitle><CardDescription>A closer look, from every angle.</CardDescription></CardHeader>
    <CardContent>
      <div className="vendor-cover-preview">{preview ? <img src={preview} alt="Cover preview" /> : <div><ImagePlus size={32} aria-hidden="true" /><strong>Your product, in focus</strong><span>Add up to five photos</span></div>}</div>
      <label className={`vendor-gallery-upload${busy || count >= MAX_PRODUCT_IMAGES ? ' vendor-upload-disabled' : ''}`}>
        <ImagePlus size={16} aria-hidden="true" />Add photos
        <input type="file" multiple accept="image/jpeg,image/png,image/webp" aria-label="Add product photos" disabled={busy || count >= MAX_PRODUCT_IMAGES}
          onChange={event => { onSelect(Array.from(event.target.files || [])); event.target.value = '' }} />
      </label>
      <p className="vendor-help">JPEG, PNG or WebP · Up to 5 MB each.<br />The cover appears in the shop and cart.</p>
      {error && <p className="vendor-field-error" role="alert">{error}</p>}
      {(images.length > 0 || pending.length > 0) && <div className="vendor-photo-list">
        {images.map((image, index) => <div className="vendor-photo-row" key={image._id}>
          <img src={image.url} alt={`Saved photo ${index + 1}`} />
          <div>{index === 0 ? <Badge variant="secondary"><Star size={12} aria-hidden="true" />Cover</Badge>
            : <Button variant="ghost" size="sm" type="button" disabled={busy} onClick={() => onCover(image._id)} aria-label={`Make photo ${index + 1} the cover`}>Make cover</Button>}<span>Photo {index + 1}</span></div>
          <Button type="button" variant="ghost" size="icon-sm" disabled={busy} onClick={() => onRemove(image._id)} aria-label={`Remove saved photo ${index + 1}`}><Trash2 /></Button>
        </div>)}
        {pending.map((image, index) => <div className="vendor-photo-row" key={image.id}>
          <img src={image.preview} alt={`New photo ${index + 1} preview`} />
          <div><Badge variant="outline">Queued</Badge><span title={image.file.name}>{image.file.name}</span></div>
          <Button type="button" variant="ghost" size="icon-sm" disabled={busy} onClick={() => onDiscard(image.id)} aria-label={`Discard new photo ${index + 1}`}><X /></Button>
        </div>)}
      </div>}
      {pending.length > 0 && <p className="vendor-help" role="status">{pending.length} new {pending.length === 1 ? 'photo uploads' : 'photos upload'} when you save. You can choose a cover after saving.</p>}
      {images.length > 0 && <p className="vendor-help">Removing saved photos and changing the cover take effect immediately.</p>}
    </CardContent>
  </Card>
}
