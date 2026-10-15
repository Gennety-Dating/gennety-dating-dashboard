import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Dev-only fixtures preview (see AGENTS.md): the Pulse endpoints are answered
// locally, so a placeholder key lets the protected routes open without a
// real ADMIN_API_KEY. Build-time constant — absent from production bundles.
if (import.meta.env.VITE_PULSE_FIXTURES === '1' && !sessionStorage.getItem('admin_api_key')) {
  sessionStorage.setItem('admin_api_key', 'fixtures')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
