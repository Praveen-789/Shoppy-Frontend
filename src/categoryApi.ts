export interface AttributeDefinition {
  key: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'stringArray'
  required: boolean
  filterable: boolean
  options: string[]
}

export interface Category {
  name: string
  slug: string
  attributes: AttributeDefinition[]
}

export type ProductAttributes = Record<string, string | number | boolean | string[]>

export async function listCategories(signal: AbortSignal): Promise<{ categories: Category[] }> {
  const response = await fetch('/api/categories', { signal })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Could not load categories. Please try again.')
  return data
}
