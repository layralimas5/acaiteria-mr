import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Elemento #root não encontrado no index.html')
}

/** Só duas telas: o site e o sistema da loja em /sistema. */
const isAdmin = window.location.pathname.replace(/\/+$/, '') === '/sistema'

/**
 * O painel é um app inteiro (pedidos, cardápio, estoque, caixa) e quem visita
 * o site nunca abre. Carregado sob demanda, ele não pesa no cliente que só
 * quer pedir um açaí.
 */
const AdminApp = lazy(() => import('./admin/AdminApp'))

createRoot(container).render(
  <StrictMode>
    {isAdmin ? (
      <Suspense
        fallback={
          <main className="grid min-h-dvh place-items-center bg-acai-50 text-sm text-muted">
            Carregando o sistema...
          </main>
        }
      >
        <AdminApp />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
