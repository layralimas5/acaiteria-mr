import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import AdminApp from './admin/AdminApp'
import './index.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Elemento #root não encontrado no index.html')
}

/** Só duas telas: o site e o sistema da loja em /sistema. */
const isAdmin = window.location.pathname.replace(/\/+$/, '') === '/sistema'

createRoot(container).render(<StrictMode>{isAdmin ? <AdminApp /> : <App />}</StrictMode>)
