import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import { useAuthStore } from './shared/stores/authStore'
import './shared/styles/globals.css'

if (import.meta.env.DEV) {
  ;(window as unknown as { useAuthStore: typeof useAuthStore }).useAuthStore = useAuthStore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
