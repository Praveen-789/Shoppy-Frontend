import type { CSSProperties } from 'react'
import { Toaster as Sonner } from 'sonner'
import type { ToasterProps } from 'sonner'

// CSS variables follow data-theme automatically, including a manual theme toggle.
export function Toaster(props: ToasterProps) {
  return <Sonner
    position="top-center"
    closeButton
    {...props}
    style={{
      '--normal-bg': 'var(--surface)',
      '--normal-text': 'var(--text)',
      '--normal-border': 'var(--border-strong)',
      colorScheme: 'inherit',
      ...props.style,
    } as CSSProperties}
    toastOptions={{
      ...props.toastOptions,
      descriptionClassName: 'toast-description',
    }}
  />
}
