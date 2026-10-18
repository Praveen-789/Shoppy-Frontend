import { useEffect, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Input } from './ui/input'
import { activeFilterCount, priceRangeError } from '../productFilters'
import type { FilterOptions, ProductFilters } from '../productFilters'
import './ShopFilters.css'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

function PriceRange({ filters, onChange }: { filters: ProductFilters; onChange: (filters: ProductFilters) => void }) {
  const [min, setMin] = useState(filters.minPrice)
  const [max, setMax] = useState(filters.maxPrice)
  const [error, setError] = useState('')
  return (
    <form className="filter-price" onSubmit={event => {
      event.preventDefault()
      const error = priceRangeError(min, max)
      setError(error)
      if (!error) onChange({ ...filters, minPrice: min, maxPrice: max })
    }}>
      <div className="filter-price-inputs">
        <label htmlFor="filter-min-price">Min ₹<Input id="filter-min-price" inputMode="decimal" placeholder="Any" value={min} maxLength={12} onChange={event => setMin(event.target.value)} aria-invalid={!!error} aria-describedby={error ? 'filter-price-error' : undefined} /></label>
        <span aria-hidden="true">–</span>
        <label htmlFor="filter-max-price">Max ₹<Input id="filter-max-price" inputMode="decimal" placeholder="Any" value={max} maxLength={12} onChange={event => setMax(event.target.value)} aria-invalid={!!error} aria-describedby={error ? 'filter-price-error' : undefined} /></label>
      </div>
      {error && <p id="filter-price-error" className="filter-error" role="alert">{error}</p>}
      <Button type="submit" variant="outline" size="sm">Apply price</Button>
    </form>
  )
}

export default function ShopFilters({ category, filters, onChange, onClear }: {
  category: string
  filters: ProductFilters
  onChange: (filters: ProductFilters) => void
  onClear: () => void
}) {
  const [options, setOptions] = useState<FilterOptions | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [expanded, setExpanded] = useState(() => !window.matchMedia('(max-width: 760px)').matches)
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const params = new URLSearchParams()
        if (category) params.set('category', category)
        const response = await fetch(`/api/products/filters?${params}`, { signal: controller.signal })
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Could not load filter options.')
        if (!controller.signal.aborted) { setOptions(data); setError('') }
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load filter options.')
      }
    }
    void load()
    return () => controller.abort()
  }, [category, retry])

  const count = activeFilterCount(filters)
  return (
    <aside className="catalog-filter-sidebar" aria-label="Product filters">
      <details className="catalog-filter-panel" open={expanded} onToggle={event => setExpanded(event.currentTarget.open)}>
        <summary><SlidersHorizontal className="size-4" aria-hidden="true" /><span>Filters</span>{count > 0 && <span className="filter-count">{count}</span>}</summary>
        <div className="catalog-filter-body">
          <div className="filter-context"><span>{options?.category?.name || (category ? category : 'All products')}</span><Button variant="ghost" size="sm" disabled={!count} onClick={onClear}>Clear all</Button></div>
          {error ? <div className="filter-error" role="alert"><p>{error}</p><Button variant="outline" size="sm" onClick={() => setRetry(value => value + 1)}>Retry filters</Button></div> : !options ? <p className="filter-hint" role="status">Loading filters…</p> : <>
            <fieldset className="filter-group"><legend>Price range</legend>
              {options.price && <p className="filter-hint">{currency.format(options.price.min)} – {currency.format(options.price.max)}</p>}
              <PriceRange key={`${filters.minPrice}:${filters.maxPrice}`} filters={filters} onChange={onChange} />
            </fieldset>
            {!category && <p className="filter-hint">Choose a category above to explore its specific filters.</p>}
            {options.attributes.filter(field => field.values.length > 0).map(field => {
              const selected = filters.attributes[field.key] || []
              return <fieldset className="filter-group" key={field.key}><legend>{field.label}</legend>
                <div className="filter-choices">{field.values.map(value => {
                  const text = String(value)
                  const checked = selected.includes(text)
                  const id = `filter-${field.key}-${encodeURIComponent(text)}`
                  return <label className="filter-choice" htmlFor={id} key={text}>
                    <Checkbox id={id} checked={checked} disabled={!checked && selected.length >= 10} onCheckedChange={checked => {
                      const values = checked === true ? [...selected, text] : selected.filter(value => value !== text)
                      const attributes = { ...filters.attributes }
                      if (values.length) attributes[field.key] = values
                      else delete attributes[field.key]
                      onChange({ ...filters, attributes })
                    }} />
                    <span>{typeof value === 'boolean' ? value ? 'Yes' : 'No' : text}</span>
                  </label>
                })}</div>
                {selected.length >= 10 && <p className="filter-hint">Up to 10 choices per filter.</p>}
              </fieldset>
            })}
            {category && !options.attributes.some(field => field.values.length) && <p className="filter-hint">No attribute choices available for this category yet.</p>}
          </>}
        </div>
      </details>
    </aside>
  )
}
