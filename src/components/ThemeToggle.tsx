import { useEffect, useState } from 'react'
import './ThemeToggle.css'

type Theme = 'light' | 'dark'

// The inline script in index.html has already put data-theme on <html> before React starts,
// so the first render simply reads what is there.
function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function SunIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}

function MoonIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme)

  // The CSS variables in index.css switch on this attribute, so keep it in step with React state.
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // Until the visitor picks a theme themselves, follow the operating system if it changes.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    function followSystem(event: MediaQueryListEvent) {
      if (!localStorage.getItem('theme')) setTheme(event.matches ? 'dark' : 'light')
    }
    media.addEventListener('change', followSystem)
    return () => media.removeEventListener('change', followSystem)
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', next)
    setTheme(next)
  }

  const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
  return <button type="button" className="theme-toggle" onClick={toggle} aria-label={label} title={label}>{theme === 'dark' ? <SunIcon /> : <MoonIcon />}</button>
}
