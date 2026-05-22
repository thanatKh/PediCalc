import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Register Service Worker for PDF filename support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {/* SW optional */});
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
