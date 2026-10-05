import { useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import { useAuth } from '../auth/useAuth'
import { listVendorProducts, saveVendorProduct, uploadVendorImage } from '../vendorApi'
import type { ProductDetails, VendorProduct } from '../vendorApi'
import ShopHeader from './ShopHeader'
import './Products.css'
import './VendorDashboard.css'

const emptyDetails: ProductDetails = { name: '', description: '', price: 0, category: '', stock: 0, status: 'draft' }
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

export default function VendorDashboard() {
  const { user, message: sessionMessage } = useAuth()
  const [products, setProducts] = useState<VendorProduct[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [editingId, setEditingId] = useState<string>()
  const [formOpen, setFormOpen] = useState(false)
  const [details, setDetails] = useState<ProductDetails>(emptyDetails)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [existingImage, setExistingImage] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!preview) return


    return () => URL.revokeObjectURL(preview)
  }, [preview])

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setListError('')
      try {
        const data = await listVendorProducts(page, controller.signal)
        if (controller.signal.aborted) return
        setProducts(data.products)
        setTotal(data.pagination.total)
        setHasMore(data.pagination.hasMore)
      } catch (error) {
        if (!controller.signal.aborted) setListError(error instanceof Error ? error.message : 'Could not load your products.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [page, refresh])

  function openForm(product?: VendorProduct) {
    setEditingId(product?._id)
    setDetails(product ? { name: product.name, description: product.description, category: product.category, price: product.price, stock: product.stock, status: product.status } : { ...emptyDetails })
    setExistingImage(product?.image || '')
    setFile(null)
    setPreview('')
    setError('')
    setNotice('')
    setFormOpen(true)
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    const button = event.nativeEvent.submitter as HTMLButtonElement | null
    const status = button?.value === 'published' ? 'published' : 'draft'
    setSaving(true)
    setError('')
    setNotice('')
    try {
      // Save as a draft until a selected image has uploaded successfully.
      let { product } = await saveVendorProduct(editingId, { ...details, status: file ? 'draft' : status })
      setEditingId(product._id)
      setDetails(current => ({ ...current, status: product.status }))
      if (file) {
        product = (await uploadVendorImage(product._id, file)).product
        setExistingImage(product.image)
        setFile(null)
        setPreview('')
        if (status === 'published') product = (await saveVendorProduct(product._id, { ...details, status })).product
      }
      setFormOpen(false)
      setNotice(product.status === 'published' ? 'Product published! Shoppers can now see it.' : 'Draft saved. Only you can see it.')
      setPage(1)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not save the product. Please retry.')
    } finally {
      setSaving(false)
      setRefresh(value => value + 1)
    }
  }

  if (!user || user.role !== 'vendor') return null

  return <div className="shop-page">
    <ShopHeader disabled={saving} />
    <main className="shop-content">
      {sessionMessage && <p role="status">{sessionMessage}</p>}
      <section className="shop-intro vendor-heading"><div><span className="shop-eyebrow">YOUR STORE</span><h1>My products</h1><p>Create something shoppers will love. Save a draft or publish when ready.</p></div><button disabled={saving} onClick={() => openForm()}>+ Add product</button></section>
      {notice && <p className="vendor-notice" role="status">{notice}</p>}
      {formOpen && <section className="vendor-editor" aria-labelledby="product-form-title">
        <h2 id="product-form-title">{editingId ? 'Edit product' : 'Add product'}</h2>
        <form onSubmit={submit}>
          <fieldset disabled={saving}>
            <div className="vendor-fields">
              <div><label htmlFor="product-name">Product name</label><input id="product-name" autoFocus required maxLength={120} value={details.name} onChange={event => setDetails({ ...details, name: event.target.value })} /></div>
              <div><label htmlFor="product-category-input">Category</label><input id="product-category-input" required maxLength={120} placeholder="e.g. Home, Clothing" value={details.category} onChange={event => setDetails({ ...details, category: event.target.value })} /></div>
              <div><label htmlFor="product-price">Price (₹)</label><input id="product-price" type="number" required min="0" max="10000000"  value={details.price} onChange={event => setDetails({ ...details, price: Number(event.target.value) })} /></div>
              <div><label htmlFor="product-stock">Stock quantity</label><input id="product-stock" type="number" required min="0" max="1000000" step="1" value={details.stock} onChange={event => setDetails({ ...details, stock: Number(event.target.value) })} /></div>
            </div>
            <label htmlFor="product-description">Description</label><textarea id="product-description" required maxLength={1000} rows={4} value={details.description} onChange={event => setDetails({ ...details, description: event.target.value })} />
            <label htmlFor="product-image">Product image (optional)</label><input key={editingId || 'new'} id="product-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => {
              const selected = event.target.files?.[0] || null
              setError('')
              if (selected && (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type) || selected.size > 5 * 1024 * 1024)) { setError('Choose a JPEG, PNG, or WebP image up to 5 MB.'); event.target.value = ''; setFile(null); setPreview(''); return }
              setFile(selected); setPreview(selected ? URL.createObjectURL(selected) : '')
            }} />
            <p className="vendor-help">JPEG, PNG, or WebP · Up to 5 MB. Without an image, your product displays a letter placeholder.</p>
            {(file ? preview : existingImage) && <img className="vendor-preview" src={file ? preview : existingImage} alt="Product preview" />}
            <div className="vendor-actions"><button type="submit" value="draft">{saving ? 'Saving…' : details.status === 'published' ? 'Unpublish and save draft' : 'Save draft'}</button><button className="vendor-primary" type="submit" value="published">{saving ? 'Saving…' : 'Publish product'}</button><button type="button" onClick={() => setFormOpen(false)}>Cancel</button></div>
          </fieldset>
          {error && <p className="vendor-error" role="alert">{error}</p>}
        </form>
      </section>}
      <section className="vendor-list" aria-label="Your products">
        <p className="shop-count">{total} products in your store</p>
        {loading ? <p role="status">Loading your products…</p> : listError ? <div role="alert"><p>{listError}</p><button onClick={() => setRefresh(value => value + 1)}>Try again</button></div> : products.length === 0 ? <p className="shop-state">Your store is ready for its first product.</p> : <div className="product-grid">{products.map(product => <article className="product-card" key={product._id}>
          <div className="product-art">{product.image ? <img src={product.image} alt={product.name} loading="lazy" /> : <span className="product-placeholder" aria-hidden="true">{product.name.charAt(0)}</span>}</div><div className="product-info"><span className={`vendor-status ${product.status}`}>{product.status === 'published' ? 'Published' : 'Draft'}</span><h2>{product.name}</h2><p>{product.category} · {product.stock} in stock</p><div className="product-bottom"><strong>{currency.format(product.price)}</strong><button disabled={saving} onClick={() => openForm(product)}>Edit</button></div></div>
        </article>)}</div>}
        <div className="vendor-pagination"><button disabled={loading || page === 1} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {page}</span><button disabled={loading || !hasMore} onClick={() => setPage(value => value + 1)}>Next</button></div>
      </section>
    </main>
  </div>
}



