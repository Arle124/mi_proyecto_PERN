import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// --- 1. Importamos Bootstrap aquí (después de instalarlo) ---
import 'bootstrap/dist/css/bootstrap.min.css'
// -----------------------------------------------------------
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
