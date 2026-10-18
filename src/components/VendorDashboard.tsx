import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Package, Plus, RefreshCw, Store } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { listVendorProducts } from '../vendorApi'
import type { VendorProduct } from '../vendorApi'
import VendorProductEditor from './VendorProductEditor'
import ShopHeader from './ShopHeader'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import './Products.css'
import './VendorDashboard.css'

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
  const [editingProduct, setEditingProduct] = useState<VendorProduct>()
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

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
    setEditingProduct(product)
    setNotice('')
    setFormOpen(true)
  }

  function saved(product: VendorProduct) {
    setFormOpen(false)
    setNotice(product.status === 'published' ? 'Product published! Shoppers can now see it.' : 'Draft saved. Only you can see it.')
    setPage(1)
  }

  if (!user || user.role !== 'vendor') return null

  return <div className="shop-page vendor-dashboard">
    <ShopHeader disabled={saving} />
    <main className="shop-content">
      {sessionMessage && <p role="status">{sessionMessage}</p>}
      <section className="vendor-heading">
        <div><span className="shop-eyebrow"><Store size={14} aria-hidden="true" />YOUR STORE / CATALOGUE</span><h1>My products<span>.</span></h1><p>Your ideas, ready for their next home. Manage everything you sell.</p></div>
        <Button disabled={saving} size="lg" onClick={() => openForm()}><Plus />Add product</Button>
      </section>
      {notice && <p className="vendor-notice" role="status"><Check size={18} aria-hidden="true" />{notice}</p>}
      {formOpen && <VendorProductEditor key={editingProduct?._id || 'new'} product={editingProduct}
        onClose={() => setFormOpen(false)} onSaved={saved} onBusyChange={setSaving}
        onProductsChanged={() => setRefresh(value => value + 1)} />}
      <section className="vendor-list" aria-labelledby="vendor-catalogue-title" aria-busy={loading}>
        <div className="vendor-list-heading"><div><h2 id="vendor-catalogue-title">Your catalogue <Badge variant="secondary">{total}</Badge></h2><p>Drafts stay private. Published products are visible in the shop.</p></div>
          <Button variant="outline" size="sm" disabled={loading || saving} onClick={() => setRefresh(value => value + 1)}><RefreshCw className={loading ? 'animate-spin' : ''} />Refresh</Button></div>
        {loading ? <p className="shop-state" role="status">Loading your products…</p>
          : listError ? <div className="vendor-empty" role="alert"><p>{listError}</p><Button variant="outline" onClick={() => setRefresh(value => value + 1)}>Try again</Button></div>
            : products.length === 0 ? <div className="vendor-empty"><Package size={36} aria-hidden="true" /><h3>Room for your next great find</h3><p>Add your first product and make this store yours.</p><Button disabled={saving} onClick={() => openForm()}><Plus />Add your first product</Button></div>
              : <div className="product-grid">{products.map(product => <article className="product-card" key={product._id}>
                <div className="product-art">{product.image ? <img src={product.image} alt={product.name} loading="lazy" /> : <span className="product-placeholder" aria-hidden="true">{product.name.charAt(0)}</span>}<Badge className={`vendor-status ${product.status}`} variant="secondary">{product.status === 'published' ? 'Published' : 'Draft'}</Badge></div>
                <div className="product-info"><span className="product-category">{product.category}</span><h3>{product.name}</h3><p className="vendor-stock">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p><div className="product-bottom"><strong>{currency.format(product.price)}</strong><Button variant="outline" size="sm" disabled={saving} onClick={() => openForm(product)} aria-label={`Edit ${product.name}`}>Edit product</Button></div></div>
              </article>)}</div>}
        <div className="vendor-pagination"><Button variant="outline" disabled={loading || page === 1} onClick={() => setPage(value => value - 1)}><ArrowLeft />Previous</Button><span>Page {page}</span><Button variant="outline" disabled={loading || !hasMore} onClick={() => setPage(value => value + 1)}>Next<ArrowRight /></Button></div>
      </section>
    </main>
  </div>
}
