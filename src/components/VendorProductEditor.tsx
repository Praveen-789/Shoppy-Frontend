import { useEffect, useRef, useState } from 'react'
import type { SubmitEvent } from 'react'
import { ArrowUpRight, LoaderCircle, Package, SlidersHorizontal, X } from 'lucide-react'
import { listCategories } from '../categoryApi'
import type { Category } from '../categoryApi'
import { attributeInputs, buildAttributes } from '../productAttributes'
import type { AttributeInputs } from '../productAttributes'
import { saveVendorProduct, removeVendorImage, setVendorCover } from '../vendorApi'
import { uploadPendingImages } from '../vendorImageUploads'
import type { ProductDetails, VendorProduct } from '../vendorApi'
import ProductAttributeFields from './ProductAttributeFields'
import VendorProductImages from './VendorProductImages'
import { productImages, validateImageSelection } from '../productImages'
import type { PendingImage } from '../productImages'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { NativeSelect, NativeSelectOption } from './ui/native-select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

interface Props {
  product?: VendorProduct
  onClose: () => void
  onSaved: (product: VendorProduct) => void
  onBusyChange: (busy: boolean) => void
  onProductsChanged: () => void
}

type ProductFormDetails = Omit<ProductDetails, 'price' | 'stock'> & { price: string; stock: string }

export default function VendorProductEditor({ product, onClose, onSaved, onBusyChange, onProductsChanged }: Props) {
  const [editingId, setEditingId] = useState(product?._id)
  const [details, setDetails] = useState<ProductFormDetails>(() => ({
    name: product?.name || '', description: product?.description || '', category: product?.category || '',
    price: product ? String(product.price) : '', stock: product ? String(product.stock) : '', status: product?.status || 'draft',
  }))
  const [values, setValues] = useState<AttributeInputs>(() => attributeInputs(product?.attributes))
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryLoading, setCategoryLoading] = useState(true)
  const [categoryError, setCategoryError] = useState('')
  const [categoryRetry, setCategoryRetry] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [images, setImages] = useState(() => productImages(product))
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [uploadProgress, setUploadProgress] = useState('')
  const [photoNotice, setPhotoNotice] = useState('')
  const [photoError, setPhotoError] = useState('')
  const previewUrls = useRef(new Set<string>())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const savingRef = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const category = categories.find(item => item.slug === details.category)
  const legacyCategory = product?.category && !categories.some(item => item.slug === product.category) ? product.category : ''
  const canSave = !categoryLoading && !categoryError && !!details.category && (!!category || details.category === legacyCategory)

  useEffect(() => { heading.current?.focus() }, [])

  useEffect(() => {
    const urls = previewUrls.current
    return () => urls.forEach(url => URL.revokeObjectURL(url))
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setCategoryLoading(true)
      setCategoryError('')
      try {
        const data = await listCategories(controller.signal)
        if (!controller.signal.aborted) setCategories(data.categories)
      } catch (error) {
        if (!controller.signal.aborted) setCategoryError(error instanceof Error ? error.message : 'Could not load categories.')
      } finally {
        if (!controller.signal.aborted) setCategoryLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [categoryRetry])

  function changeCategory(slug: string) {
    setDetails(current => ({ ...current, category: slug }))
    setValues({})
    setFieldErrors({})
    setError('')
  }

  function changeAttribute(key: string, value: string | string[]) {
    setValues(current => ({ ...current, [key]: value }))
    setFieldErrors(current => ({ ...current, [key]: '' }))
  }

  function selectImages(files: File[]) {
    setPhotoNotice('')
    const message = validateImageSelection(images.length + pendingImages.length, files)
    if (message) { setPhotoError(message); return }
    const selected = files.map(file => {
      const preview = URL.createObjectURL(file)
      previewUrls.current.add(preview)
      return { id: crypto.randomUUID(), file, preview }
    })
    setPendingImages(current => [...current, ...selected])
    setPhotoError('')
    setError('')
  }

  function discardImage(id: string) {
    setPhotoError('')
    const image = pendingImages.find(item => item.id === id)
    if (image) { URL.revokeObjectURL(image.preview); previewUrls.current.delete(image.preview) }
    setPendingImages(current => current.filter(item => item.id !== id))
  }

  async function changeSavedImage(imageId: string, action: 'cover' | 'remove') {
    if (!editingId || savingRef.current) return
    savingRef.current = true
    setSaving(true)
    onBusyChange(true)
    setError('')
    setPhotoNotice('')
    setPhotoError('')
    try {
      const result = await (action === 'cover' ? setVendorCover(editingId, imageId) : removeVendorImage(editingId, imageId))
      setImages(productImages(result.product))
      setPhotoNotice(action === 'cover' ? 'Cover photo updated.' : 'Photo removed.')
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'Could not update photos. Please retry.')
    } finally {
      savingRef.current = false
      setSaving(false)
      onBusyChange(false)
      onProductsChanged()
    }
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (savingRef.current || !canSave) return
    const result = category ? buildAttributes(category, values) : { attributes: {}, errors: {} }
    setFieldErrors(result.errors)
    if (Object.keys(result.errors).length) {
      setError('Check the highlighted specifications before saving.')
      document.getElementById(`attribute-${Object.keys(result.errors)[0]}`)?.focus()
      return
    }
    const button = event.nativeEvent.submitter as HTMLButtonElement | null
    const status = button?.value === 'published' ? 'published' : 'draft'
    // Legacy edits omit attributes so older product data is not silently erased.
    const payload: ProductDetails = { ...details, price: Number(details.price), stock: Number(details.stock),
      ...(category ? { attributes: result.attributes } : {}) }
    savingRef.current = true
    setSaving(true)
    onBusyChange(true)
    setError('')
    try {
      // Keep selected photos in draft until all uploads have succeeded.
      let { product: saved } = await saveVendorProduct(editingId, { ...payload, status: pendingImages.length ? 'draft' : status })
      setEditingId(saved._id)
      setDetails(current => ({ ...current, status: saved.status }))
      saved = await uploadPendingImages(saved, pendingImages, (image, uploaded) => {
        setImages(productImages(uploaded))
        discardImage(image.id)
      }, (index, total) => setUploadProgress(`Uploading photo ${index} of ${total}…`))
      if (pendingImages.length && status === 'published') saved = (await saveVendorProduct(saved._id, { ...payload, status })).product
      onSaved(saved)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not save the product. Please retry.')
    } finally {
      savingRef.current = false
      setSaving(false)
      setUploadProgress('')
      onBusyChange(false)
      onProductsChanged()
    }
  }

  return <section className="vendor-editor" aria-labelledby="product-form-title">
    <div className="vendor-editor-heading">
      <div><span className="shop-eyebrow">PRODUCT WORKSPACE</span><h2 id="product-form-title" ref={heading} tabIndex={-1}>{editingId ? 'Edit your product' : 'Create a new product'}</h2>
        <p>A few thoughtful details make a great first impression.</p></div>
      <Button type="button" variant="ghost" size="icon" disabled={saving} onClick={onClose} aria-label="Close product editor"><X /></Button>
    </div>
    <form onSubmit={submit}>
      <fieldset className="vendor-editor-fields" disabled={saving}>
        <div className="vendor-editor-layout">
          <div className="vendor-editor-main">
            <Card>
              <CardHeader><CardTitle><h3><Package aria-hidden="true" />The essentials</h3></CardTitle><CardDescription>Give your product a name, a home and a price.</CardDescription></CardHeader>
              <CardContent>
                <div className="vendor-fields">
                  <div className="vendor-field vendor-field-wide"><label htmlFor="product-name">Product name <span className="vendor-required">*</span></label><Input id="product-name" required maxLength={120} placeholder="e.g. Classic cotton summer dress" value={details.name} onChange={event => setDetails({ ...details, name: event.target.value })} /></div>
                  <div className="vendor-field vendor-field-wide"><label htmlFor="product-category">Category <span className="vendor-required">*</span></label>
                    <NativeSelect id="product-category" required value={details.category} disabled={saving || categoryLoading || !!categoryError} onChange={event => changeCategory(event.target.value)}>
                      <NativeSelectOption value="">{categoryLoading ? 'Loading categories…' : 'Choose a category'}</NativeSelectOption>
                      {legacyCategory && <NativeSelectOption value={legacyCategory}>{legacyCategory} (existing category)</NativeSelectOption>}
                      {categories.map(item => <NativeSelectOption key={item.slug} value={item.slug}>{item.name}</NativeSelectOption>)}
                    </NativeSelect>
                    {categoryLoading ? <p className="vendor-help" role="status">Loading category definitions…</p>
                      : categoryError ? <div className="vendor-inline-error" role="alert"><p>{categoryError}</p><Button type="button" variant="outline" size="sm" onClick={() => setCategoryRetry(value => value + 1)}>Retry categories</Button></div>
                        : !categories.length ? <p className="vendor-help" role="status">No categories are available yet. Contact the store administrator to add them.</p>
                          : <p className="vendor-help">Changing category clears the specifications below.</p>}
                  </div>
                  <div className="vendor-field"><label htmlFor="product-price">Price (₹) <span className="vendor-required">*</span></label><Input id="product-price" type="number" required min="0" max="10000000" step="0.01" placeholder="0.00" value={details.price} onChange={event => setDetails({ ...details, price: event.target.value })} /></div>
                  <div className="vendor-field"><label htmlFor="product-stock">Stock quantity <span className="vendor-required">*</span></label><Input id="product-stock" type="number" required min="0" max="1000000" step="1" placeholder="0" value={details.stock} onChange={event => setDetails({ ...details, stock: event.target.value })} /></div>
                  <div className="vendor-field vendor-field-wide"><label htmlFor="product-description">Description <span className="vendor-required">*</span></label><Textarea id="product-description" required maxLength={1000} rows={4} placeholder="What makes this product special? Share the details shoppers should know." value={details.description} onChange={event => setDetails({ ...details, description: event.target.value })} /><p className="vendor-help">{details.description.length}/1000 characters</p></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle><h3><SlidersHorizontal aria-hidden="true" />{category ? `${category.name} specifications` : 'Product specifications'}</h3></CardTitle><CardDescription>Help shoppers find exactly what they’re looking for. Fields marked * are required, including for drafts.</CardDescription></CardHeader>
              <CardContent>
                {categoryLoading ? <p className="vendor-spec-placeholder" role="status">Loading specifications…</p>
                  : categoryError ? <p className="vendor-spec-placeholder">Specifications will appear once categories are loaded.</p>
                    : category ? category.attributes.length > 0
                      ? <ProductAttributeFields category={category} values={values} errors={fieldErrors} disabled={saving} onChange={changeAttribute} />
                      : <p className="vendor-spec-placeholder">This category doesn’t need extra specifications.</p>
                      : <p className="vendor-spec-placeholder">{legacyCategory && details.category === legacyCategory
                        ? 'You can keep this existing category. Choose a current category above to add specifications.'
                        : 'Choose a category above to see the right fields for your product.'}</p>}
              </CardContent>
            </Card>
          </div>
          <aside className="vendor-editor-aside" aria-label="Product presentation">
            <VendorProductImages images={images} pending={pendingImages} busy={saving} error={photoError} onSelect={selectImages} onDiscard={discardImage}
              onRemove={id => { void changeSavedImage(id, 'remove') }} onCover={id => { void changeSavedImage(id, 'cover') }} />
            <div className="vendor-publishing-note"><Badge variant="secondary">Your pace, your store</Badge><h3>Not quite ready?</h3><p>Save a draft to keep it private. Publish when you’re ready for shoppers to discover it.</p></div>
          </aside>
        </div>
        <div className="vendor-save-bar"><p><span className="vendor-required">*</span> Required fields <span>·</span> Prices are in INR</p><div className="vendor-actions">
          <Button type="button" variant="ghost" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="outline" value="draft" disabled={saving || !canSave}>{details.status === 'published' ? 'Unpublish & save draft' : 'Save draft'}</Button>
          <Button type="submit" value="published" disabled={saving || !canSave}>{saving ? <><LoaderCircle className="animate-spin" />Saving…</> : <>{details.status === 'published' ? 'Save & publish' : 'Publish product'}<ArrowUpRight /></>}</Button>
        </div></div>
      </fieldset>
      {uploadProgress && <p className="vendor-help" role="status">{uploadProgress}</p>}
      {photoNotice && <p className="vendor-help" role="status">{photoNotice}</p>}
      {error && <p className="vendor-error" role="alert">{error}</p>}
    </form>
  </section>
}
