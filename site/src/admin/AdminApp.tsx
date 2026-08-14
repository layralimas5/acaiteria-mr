import { useCallback, useEffect, useMemo, useState } from 'react'
import { business } from '../config/business'
import { formatPrice } from '../lib/order'
import { notifyUrl } from '../orders/messages'
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
const NOTIFY_KEY = 'acaiteria-mr:admin-notify'

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
  const [autoNotify, setAutoNotify] = useState(
    () => window.localStorage.getItem(NOTIFY_KEY) !== 'off',
  )

  const refresh = useCallback(() => setOrders(listOrders()), [])

  useEffect(() => {
    if (!authorized) return
    refresh()
    return subscribeToOrders(refresh)
  }, [authorized, refresh])

  useEffect(() => {
    window.localStorage.setItem(NOTIFY_KEY, autoNotify ? 'on' : 'off')
  }, [autoNotify])

  /** Muda o status e, se ligado, já abre o WhatsApp do cliente com o aviso. */
  const advance = useCallback(
    (order: Order, status: OrderStatus) => {
      updateOrderStatus(order.id, status)
      if (autoNotify) {
        window.open(notifyUrl(order, status), '_blank', 'noopener,noreferrer')
      }
    },
    [autoNotify],
  )

  const counts = useMemo(() => {
    const byStatus = (status: OrderStatus) => orders.filter((order) => order.status === status).length
    return {
      ativos: orders.filter((order) => order.status !== 'concluido' && order.status !== 'cancelado').length,
      novo: byStatus('novo'),
      preparando: byStatus('preparando'),
      entrega: byStatus('entrega'),
      concluido: byStatus('concluido'),
      cancelado: byStatus('cancelado'),
    } satisfies Record<Filter, number>
  }, [orders])

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
    }
  }, [orders])

  if (!authorized) {
    return <Login onAuthorized={() => setAuthorized(true)} />
  }

  const sidebar = (
    <>
      <div className="flex items-center gap-3">
        <Logo className="size-12 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-white">{business.name}</p>
          <p className="text-xs text-acai-200">Sistema de pedidos</p>
        </div>
      </div>

      <nav aria-label="Filtrar pedidos" className="mt-6">
        <p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-acai-300">Pedidos</p>
        <ul className="mt-2 space-y-1">
          {filters.map((item) => {
            const active = filter === item.id
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setFilter(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    active ? 'bg-white text-acai-900' : 'text-acai-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      active ? 'bg-acai-100 text-acai-900' : 'bg-white/10 text-acai-100'
                    }`}
                  >
                    {counts[item.id]}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mt-6 space-y-2">
        <p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-acai-300">Hoje</p>
        <div className="rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10">
          <p className="text-xs text-acai-200">Pedidos</p>
          <p className="text-lg font-extrabold text-white">{today.count}</p>
        </div>
        <div className="rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10">
          <p className="text-xs text-acai-200">Faturamento</p>
          <p className="text-lg font-extrabold text-white">{formatPrice(today.revenue)}</p>
        </div>
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl bg-white/5 px-3 py-3 ring-1 ring-white/10">
        <input
          type="checkbox"
          checked={autoNotify}
          onChange={(event) => setAutoNotify(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-white"
        />
        <span className="min-w-0">
          <span className="block text-xs font-bold text-white">Avisar cliente ao mudar status</span>
          <span className="mt-0.5 block text-[11px] leading-snug text-acai-200">
            Abre o WhatsApp com a mensagem pronta.
          </span>
        </span>
      </label>

      <div className="mt-auto space-y-2 pt-6">
        <a
          href="/"
          className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-acai-100/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          Ver site
        </a>
        <button
          type="button"
          onClick={() => {
            window.sessionStorage.removeItem(SESSION_KEY)
            setAuthorized(false)
          }}
          className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-acai-100/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          Sair
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-acai-950 text-white lg:flex">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-white/10 bg-acai-950 p-5 lg:flex lg:h-screen lg:sticky lg:top-0">
        {sidebar}
      </aside>

      {/* No celular a mesma navegação vira topo compacto. */}
      <header className="border-b border-white/10 px-5 py-4 lg:hidden">
        <div className="flex items-center gap-3">
          <Logo className="size-11 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold">{business.name}</p>
            <p className="text-xs text-acai-200">
              {today.count} pedidos hoje · {formatPrice(today.revenue)}
            </p>
          </div>
          <a href="/" className="rounded-full border border-white/25 px-3 py-1.5 text-xs font-bold">
            Site
          </a>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {filters.map((item) => {
            const active = filter === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`rounded-lg px-2 py-2 text-[11px] font-bold transition-colors ${
                  active ? 'bg-white text-acai-900' : 'bg-white/10 text-acai-100'
                }`}
              >
                {item.label}
                <span className="ml-1 opacity-70">{counts[item.id]}</span>
              </button>
            )
          })}
        </div>

        <label className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-acai-200">
          <input
            type="checkbox"
            checked={autoNotify}
            onChange={(event) => setAutoNotify(event.target.checked)}
            className="size-4 accent-white"
          />
          Avisar cliente no WhatsApp ao mudar status
        </label>
      </header>

      <main className="min-w-0 flex-1 px-5 py-6">
        <h1 className="text-lg font-extrabold">
          {filter === 'ativos' ? 'Pedidos em aberto' : statusLabels[filter as OrderStatus]}
          <span className="ml-2 text-sm font-semibold text-acai-300">{visible.length}</span>
        </h1>

        {visible.length === 0 ? (
          <p className="mt-6 rounded-card border border-dashed border-white/20 p-10 text-center text-sm text-acai-200">
            {filter === 'ativos'
              ? 'Nenhum pedido em aberto agora. Os novos aparecem aqui sozinhos.'
              : `Nenhum pedido em "${statusLabels[filter as OrderStatus]}".`}
          </p>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {visible.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onAdvance={advance}
                onCancel={(target) => advance(target, 'cancelado')}
                onRemove={removeOrder}
              />
            ))}
          </div>
        )}
      </main>
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
        className="w-full max-w-sm rounded-card border border-white/10 bg-white/5 p-6 text-white backdrop-blur-sm"
      >
        <div className="flex flex-col items-center text-center">
          <Logo className="size-20" />
          <h1 className="mt-4 text-xl font-extrabold">Sistema da loja</h1>
          <p className="mt-1 text-sm text-acai-200">Entre para ver os pedidos do site.</p>
        </div>

        <label className="mt-6 block">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-acai-300">Senha</span>
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setError(false)
            }}
            autoFocus
            className="mt-1.5 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-acai-300 focus:border-white/50"
          />
        </label>

        {error && <p className="mt-2 text-xs font-semibold text-amber-300">Senha incorreta.</p>}

        <button
          type="submit"
          className="mt-5 w-full rounded-full bg-white px-6 py-3.5 text-sm font-bold text-acai-900 transition-colors hover:bg-acai-50"
        >
          Entrar
        </button>

        <a href="/" className="mt-3 block text-center text-xs font-semibold text-acai-300 hover:text-white">
          Voltar para o site
        </a>
      </form>
    </div>
  )
}
