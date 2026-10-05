export const addressFields = [
  { key: 'name', label: 'Recipient name', max: 120, auto: 'name' },
  { key: 'phone', label: 'Mobile number', max: 10, auto: 'tel-national', pattern: '[6-9][0-9]{9}' },
  { key: 'line1', label: 'House / flat and street', max: 200, auto: 'address-line1' },
  { key: 'line2', label: 'Area / landmark (optional)', max: 200, auto: 'address-line2' },
  { key: 'city', label: 'City', max: 100, auto: 'address-level2' },
  { key: 'state', label: 'State', max: 100, auto: 'address-level1' },
  { key: 'postalCode', label: 'PIN code', max: 6, auto: 'postal-code', pattern: '[1-9][0-9]{5}' },
] as const

export interface DeliveryAddress {
  name: string
  phone: string
  line1: string
  line2: string
  city: string
  state: string
  postalCode: string
}
