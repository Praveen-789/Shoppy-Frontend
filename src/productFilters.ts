export interface ProductFilters {
  minPrice: string
  maxPrice: string
  attributes: Record<string, string[]>
}

export interface ProductQuery extends ProductFilters {
  search: string
  category: string
  page: number
}

export interface FilterOptions {
  category: { slug: string; name: string } | null
  price: { min: number; max: number } | null
  attributes: {
    key: string
    label: string
    type: 'string' | 'number' | 'boolean' | 'stringArray'
    values: (string | number | boolean)[]
  }[]
}

export function emptyProductFilters(): ProductFilters {
  return { minPrice: '', maxPrice: '', attributes: {} }
}

export function productSearchParams(query: ProductQuery) {
  const params = new URLSearchParams({ page: String(query.page), limit: '12' })
  if (query.search) params.set('search', query.search)
  if (query.category) params.set('category', query.category)
  if (query.minPrice !== '') params.set('minPrice', query.minPrice)
  if (query.maxPrice !== '') params.set('maxPrice', query.maxPrice)
  for (const [key, values] of Object.entries(query.attributes)) {
    for (const value of values) params.append(`attr.${key}`, value)
  }
  return params
}

export function priceRangeError(min: string, max: string) {
  for (const value of [min, max]) {
    if (value !== '' && (!/^\d+(?:\.\d{1,2})?$/.test(value) || Number(value) > 10000000)) {
      return 'Enter prices from 0 to 1,00,00,000 with up to two decimal places.'
    }
  }
  return min !== '' && max !== '' && Number(min) > Number(max)
    ? 'Minimum price must be less than or equal to maximum price.' : ''
}

export function activeFilterCount(filters: ProductFilters) {
  return Object.values(filters.attributes).reduce((count, values) => count + values.length, 0)
    + (filters.minPrice !== '' || filters.maxPrice !== '' ? 1 : 0)
}
