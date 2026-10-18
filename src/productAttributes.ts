import type { Category, ProductAttributes } from './categoryApi'

// Keep numbers as text while typing, so an empty input is not accidentally saved as 0.
export type AttributeInputs = Record<string, string | string[]>

export function attributeInputs(attributes: ProductAttributes = {}): AttributeInputs {
  return Object.fromEntries(Object.entries(attributes).map(([key, value]) =>
    [key, Array.isArray(value) ? [...value] : String(value)]))
}

export function buildAttributes(category: Category, inputs: AttributeInputs) {
  const attributes: ProductAttributes = {}
  const errors: Record<string, string> = {}
  for (const definition of category.attributes) {
    const { key, label, type, required, options } = definition
    const raw = inputs[key]
    const text = typeof raw === 'string' ? raw.trim() : ''
    const values = type === 'stringArray'
      ? (Array.isArray(raw) ? raw : text ? text.split(',').map(value => value.trim()) : [])
      : []
    const empty = type === 'stringArray' ? values.length === 0 : !text
    if (empty) {
      if (required) errors[key] = `${label} is required.`
      continue
    }
    if (type === 'number') {
      const value = Number(text)
      if (!Number.isFinite(value)) errors[key] = `${label} must be a number.`
      else attributes[key] = value
    } else if (type === 'boolean') {
      if (!['true', 'false'].includes(text)) errors[key] = `Choose Yes or No for ${label}.`
      else attributes[key] = text === 'true'
    } else if (type === 'stringArray') {
      if (values.length > 100 || values.some(value => !value || value.length > 120)) {
        errors[key] = `${label} needs up to 100 nonempty values, each up to 120 characters.`
      } else if (new Set(values).size !== values.length) errors[key] = `${label} must not contain duplicates.`
      else if (options.length && values.some(value => !options.includes(value))) errors[key] = `Choose an available option for ${label}.`
      else attributes[key] = values
    } else {
      if (text.length > 120) errors[key] = `${label} must be at most 120 characters.`
      else if (options.length && !options.includes(text)) errors[key] = `Choose an available option for ${label}.`
      else attributes[key] = text
    }
  }
  return { attributes, errors }
}
