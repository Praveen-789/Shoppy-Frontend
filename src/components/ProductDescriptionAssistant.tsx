import { useEffect, useRef, useState } from 'react'
import { generateVendorDescription } from '../vendorApi'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'

export default function ProductDescriptionAssistant({ name, category, onApply }: {
  name: string; category: string; onApply: (description: string) => void
}) {
  const [facts, setFacts] = useState('')
  const [suggestion, setSuggestion] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const active = useRef<AbortController | null>(null)
  useEffect(() => () => active.current?.abort(), [])

  async function generate() {
    if (active.current) return
    const controller = new AbortController()
    active.current = controller
    setBusy(true)
    setError('')
    setSuggestion('')
    try {
      const result = await generateVendorDescription({ name, category, facts }, controller.signal)
      if (!controller.signal.aborted) setSuggestion(result.description)
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not generate a description.')
    } finally {
      if (!controller.signal.aborted) {
        active.current = null
        setBusy(false)
      }
    }
  }

  return <div className="vendor-field vendor-field-wide">
    <label htmlFor="product-ai-facts">AI description assistant — product facts</label>
    <Textarea id="product-ai-facts" rows={3} maxLength={1000} value={facts} disabled={busy}
      placeholder="e.g. Cotton, blue, two front pockets, machine washable"
      onChange={event => { setFacts(event.target.value); setSuggestion('') }} />
    <p className="vendor-help">Product name, category and these facts are sent to Claude. Check the suggestion for accuracy before using it. Applying it replaces the description above; saving is still your choice.</p>
    <Button type="button" variant="outline" disabled={busy || !name.trim() || !category || !facts.trim()} onClick={() => { void generate() }}>
      {busy ? 'Generating…' : 'Generate description'}
    </Button>
    {busy && <p role="status" className="vendor-help">Claude is drafting your description…</p>}
    {error && <p role="alert" className="vendor-error">{error}</p>}
    {suggestion && <div>
      <p className="vendor-help" role="status">Suggested description</p>
      <p style={{ whiteSpace: 'pre-wrap' }}> {suggestion}</p>
      <Button type="button" variant="outline" onClick={() => { onApply(suggestion); setSuggestion('') }}>Use this description</Button>
      <Button type="button" variant="ghost" onClick={() => setSuggestion('')}>Discard</Button>
    </div>}
  </div>
}
