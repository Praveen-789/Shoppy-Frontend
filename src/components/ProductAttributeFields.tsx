import type { Category } from '../categoryApi'
import type { AttributeInputs } from '../productAttributes'
import { Input } from './ui/input'
import { NativeSelect, NativeSelectOption } from './ui/native-select'
import { Checkbox } from './ui/checkbox'

interface Props {
  category: Category
  values: AttributeInputs
  errors: Record<string, string>
  disabled: boolean
  onChange: (key: string, value: string | string[]) => void
}

export default function ProductAttributeFields({ category, values, errors, disabled, onChange }: Props) {
  return <div className="vendor-fields">{category.attributes.map(definition => {
    const { key, label, type, required, options } = definition
    const id = `attribute-${key}`
    const error = errors[key]
    const value = values[key]
    const text = typeof value === 'string' ? value : ''
    const selected = Array.isArray(value) ? value : []
    const choiceGroup = type === 'stringArray' && options.length > 0
    const props = { id, required, disabled, 'aria-invalid': !!error, 'aria-describedby': error ? `${id}-error` : undefined }

    return <div className={`vendor-field${choiceGroup ? ' vendor-field-wide' : ''}`} key={key}>
      {choiceGroup ? <fieldset className="vendor-choice-field" aria-describedby={error ? `${id}-error` : undefined}>
        <legend>{label}{required ? <span className="vendor-required"> *</span> : <span className="vendor-optional"> Optional</span>}</legend>
        <div className="vendor-choices" id={id} tabIndex={-1}>
          {options.map((option, index) => <label className="vendor-choice" key={option} htmlFor={`${id}-${index}`}>
            <Checkbox id={`${id}-${index}`} checked={selected.includes(option)} disabled={disabled}
              aria-invalid={!!error} onCheckedChange={checked => onChange(key,
                checked === true ? [...selected, option] : selected.filter(item => item !== option))} />
            <span>{option}</span>
          </label>)}
        </div>
      </fieldset> : <>
        <label htmlFor={id}>{label}{required ? <span className="vendor-required"> *</span> : <span className="vendor-optional"> Optional</span>}</label>
        {type === 'boolean' || (type === 'string' && options.length > 0)
          ? <NativeSelect {...props} value={text} onChange={event => onChange(key, event.target.value)}>
            <NativeSelectOption value="">Select {label.toLowerCase()}</NativeSelectOption>
            {type === 'boolean'
              ? <><NativeSelectOption value="true">Yes</NativeSelectOption><NativeSelectOption value="false">No</NativeSelectOption></>
              : options.map(option => <NativeSelectOption key={option} value={option}>{option}</NativeSelectOption>)}
          </NativeSelect>
          : <Input {...props} type={type === 'number' ? 'number' : 'text'} step={type === 'number' ? 'any' : undefined}
            maxLength={type === 'string' ? 120 : undefined}
            value={Array.isArray(value) ? value.join(', ') : text} onChange={event => onChange(key, event.target.value)} />}
        {type === 'stringArray' && <p className="vendor-help">Separate values with commas.</p>}
      </>}
      {error && <p id={`${id}-error`} className="vendor-field-error">{error}</p>}
    </div>
  })}</div>
}
