import { useCallback, useEffect, useMemo, useState } from 'react'
import { business } from '../config/business'
import { formatPrice } from '../lib/order'
import { listOrders, removeOrder, subscribeToOrders, updateOrderStatus } from '../orders/store'
import type { Order, OrderStatus } from '../orders/types'
import { statusLabels } from '../orders/types'
import { Logo } from '../components/Logo'
import { OrderCard } from './OrderCard'

/**
 * Painel da loja: acompanha os pedidos que entram pelo site e dá baixa.
 *
 * A senha é uma trava simples de balcão, não segurança de verdade — ela vive
 * no navegador. Quando os pedidos passarem para o Supabase, a autenticação
 * passa a ser feita lá (ver docs/sistema.md).
 */

const PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'mr2026'
const SESSION_KEY = 'acaiteria-mr:admin'

type Filter = OrderStatus | 'ativos'

const filters: readonly { readonly id: Filter; readonly label: string }[] = [
  { id: 'ativos', label: 'Em aberto' },
  { id: 'novo', label: 'Novos' },
  { id: 'preparando', label: 'Preparando' },
  { id: 'entrega', label: 'Em entrega' },
  { id: 'concluido', label: 'Concluídos' },
  { id: 'cancelado', label: 'Cancelados' },
]

export default function AdminApp() {
  const [authorized, setAuthorized] = useState(() => window.sessionStorage.getItem(SESSION_KEY) === 'ok')
  const [orders, setOrders] = useState<readonly Order[]>([])
  const [filter, setFilter] = useState<Filter>('ativos')

  const refresh = useCallback(() => setOrders(listOrders()), [])

  useEffect(() => {
    if (!authorized) return
    refresh()
    return subscribeToOrders(refresh)
  }, [authorized, refresh])

  const visible = useMemo(() => {
    if (filter === 'ativos') {
      return orders.filter((order) => order.status !== 'concluido' && order.status !== 'cancelado')
    }
    return orders.filter((order) => order.status === filter)
  }, [orders, filter])

  const today = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const todays = orders.filter(
      (order) => new Date(order.createdAt) >= start && order.status !== 'cancelado',
    )
    return {
      count: todays.length,
      revenue: todays.reduce((total, order) => total + order.total, 0),
      open: todays.filter((order) => order.status !== 'concluido').length,
    }
  }, [orders])

  if (!authorized) {
    return <Login onAuthorized={() => setAuthorized(true)} />
  }

  return (
    <div className="min-h-screen bg-acai-50">
      <header className="sticky top-0 z-10 border-b border-acai-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-3">
            <Logo className="size-10" />
            <div>
              <p className="text-sm font-extrabold text-ink">Sistema · {business.name}</p>
              <p className="text-xs text-muted">Pedidos do site em tempo real</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              className="rounded-full border border-acai-200 px-4 py-2 text-xs font-bold text-acai-800 transition-colors hover:bg-acai-50"
            >
              Ver site
            </a>
            <button
              type="button"
              onClick={() => {
                window.sessionStorage.removeItem(SESSION_KEY)
                setAuthorized(false)
              }}
              className="rounded-full px-4 py-2 text-xs font-semibold text-muted transition-colors hover:text-acai-800"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-6">
        <section aria-label="Resumo do dia" className="grid gap-3 sm:grid-cols-3">
          <Metric label="Pedidos hoje" value={String(today.count)} />
          <Metric label="Em aberto" value={String(today.open)} highlight={today.open > 0} />
          <Metric label="Faturamento do dia" value={formatPrice(today.revenue)} />
        </section>

        <div role="tablist" aria-label="Filtrar pedidos" className="mt-6 flex flex-wrap gap-2">
          {filters.map((item) => {
            const active = filter === item.id
            const count =
              item.id === 'ativos'
                ? orders.filter((o) => o.status !== 'concluido' && o.status !== 'cancelado').length
                : orders.filter((o) => o.status === item.id).length

            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(item.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-acai-800 text-white'
                    : 'border border-acai-100 bg-white text-muted hover:border-acai-300 hover:text-acai-800'
                }`}
              >
                {item.label}
                <span className={`ml-1.5 text-xs ${active ? 'text-acai-100' : 'text-acai-400'}`}>{count}</span>
              </button>
            )
          })}
        </div>

        {visible.length === 0 ? (
          <p className="mt-8 rounded-card border border-dashed border-acai-200 bg-white p-10 text-center text-sm text-muted">
            {filter === 'ativos'
              ? 'Nenhum pedido em aberto agora. Os novos aparecem aqui sozinhos.'
              : `Nenhum pedido em "${statusLabels[filter as OrderStatus]}".`}
          </p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onAdvance={updateOrderStatus}
                onCancel={(id) => updateOrderStatus(id, 'cancelado')}
                onRemove={removeOrder}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function Metric({
  label,
  value,
  highlight = false,
}: {
  readonly label: string
  readonly value: string
  readonly highlight?: boolean
}) {
  return (
    <div
      className={`rounded-card border p-4 ${
        highlight ? 'border-amber-200 bg-amber-50' : 'border-acai-100 bg-white'
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-acai-700">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-ink">{value}</p>
    </div>
  )
}

function Login({ onAuthorized }: { readonly onAuthorized: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  return (
    <div className="grid min-h-screen place-items-center bg-acai-950 px-5">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (password === PASSWORD) {
            window.sessionStorage.setItem(SESSION_KEY, 'ok')
            onAuthorized()
            return
          }
          setError(true)
        }}
        className="w-full max-w-sm rounded-card bg-white p-6 shadow-2xl"
      >
        <Logo className="size-14" />
        <h1 className="mt-4 text-xl font-extrabold text-ink">Sistema da loja</h1>
        <p className="mt-1 text-sm text-muted">Entre para ver os pedidos do site.</p>

        <label className="mt-5 block">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-acai-700">Senha</span>
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setError(false)
            }}
            autoFocus
            className="mt-1.5 w-full rounded-xl border border-acai-200 px-3 py-2.5 text-sm text-ink outline-none focus:border-acai-700"
          />
        </label>

        {error && <p className="mt-2 text-xs font-semibold text-amber-700">Senha incorreta.</p>}

        <button
          type="submit"
          className="mt-5 w-full rounded-full bg-acai-800 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-acai-900"
        >
          Entrar
        </button>

        <a href="/" className="mt-3 block text-center text-xs font-semibold text-muted hover:text-acai-800">
          Voltar para o site
        </a>
      </form>
    </div>
  )
}
