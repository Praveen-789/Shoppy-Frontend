import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import AuthProvider from './auth/AuthProvider'
import { Toaster } from './components/ui/sonner'
import { TooltipProvider } from './components/ui/tooltip'

// TooltipProvider is required once, above every Tooltip in the app (the header's icon links use them).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter><AuthProvider><TooltipProvider><App /><Toaster /></TooltipProvider></AuthProvider></BrowserRouter>
  </StrictMode>,
)


