import { useCallback, useEffect, useMemo, useState } from 'react'
import { signOut, useSession } from '../auth/useSession'
import { business } from '../config/business'
import { errorMessage } from '../lib/supabase'
import { formatPrice } from '../lib/order'
import { notifyUrl } from '../orders/messages'
import { listOrders, removeOrder, subscribeToOrders, updateOrderStatus } from '../orders/store'
import type { Order, OrderStatus } from '../orders/types'
import { Logo } from '../components/Logo'
import type { InventoryItem } from '../inventory/store'
import { listItems, needsRestock, subscribeToInventory } from '../inventory/store'
import { AccountView } from './AccountView'
import { Dashboard } from './Dashboard'
import { DeliveriesView } from './DeliveriesView'
import { FinanceView } from './FinanceView'
import { InventoryView } from './InventoryView'
import { LoginView } from './LoginView'
import { MenuView } from './menu/MenuView'
import { OrdersView } from './OrdersView'
import { ReviewsView } from './ReviewsView'
import { SettingsView } from './SettingsView'
import { UserMenu } from './UserMenu'

/**
 * Painel da loja: acompanha os pedidos que entram pelo site e dá baixa.
 *
 * Tudo aqui exige login: pedido, caixa e estoque são dados de gente real, e o
 * Row Level Security do banco não devolve nenhuma linha para quem não entrou.
 */

const NOTIFY_KEY = 'acaiteria-mr:admin-notify'

type Section =
  | 'dashboard'
  | 'pedidos'
  | 'entregas'
  | 'estoque'
  | 'cardapio'
  | 'financeiro'
  | 'avaliacoes'
  | 'conta'
  | 'config'

export default function AdminApp() {
  const { session, loading: checkingSession } = useSession()

  if (checkingSession) {
    return (
      <main className="grid min-h-dvh place-items-center bg-acai-50 text-sm text-muted">
        Carregando...
      </main>
    )
  }

  if (!session) return <LoginView />

  return <Panel email={session.user.email ?? ''} />
}

function Panel({ email }: { readonly email: string }) {
  const [orders, setOrders] = useState<readonly Order[]>([])
  const [error, setError] = useState<string | null>(null)
  const [section, setSection] = useState<Section>('dashboard')
  const [autoNotify, setAutoNotify] = useState(
    () => window.localStorage.getItem(NOTIFY_KEY) !== 'off',
  )

  const [supplies, setSupplies] = useState<readonly InventoryItem[]>([])

  const refresh = useCallback(() => {
    void listOrders()
      .then((list) => {
        setOrders(list)
        setError(null)
      })
      .catch((cause: unknown) => setError(errorMessage(cause)))
  }, [])

  // O Realtime avisa de qualquer mudança, inclusive de pedido feito no celular
  // do cliente: o painel atualiza sem ninguém recarregar a página.
  useEffect(() => {
    refresh()
    return subscribeToOrders(refresh)
  }, [refresh])

  useEffect(() => {
    const sync = () => {
      void listItems()
        .then(setSupplies)
        .catch(() => setSupplies([]))
    }
    sync()
    return subscribeToInventory(sync)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(NOTIFY_KEY, autoNotify ? 'on' : 'off')
  }, [autoNotify])

  /** Muda o status e, se ligado, já abre o WhatsApp do cliente com o aviso. */
  const advance = useCallback(
    (order: Order, status: OrderStatus) => {
      // A aba abre antes de gravar de propósito: aberta depois da resposta do
      // banco, o navegador entende como popup e bloqueia.
      if (autoNotify) {
        window.open(notifyUrl(order, status), '_blank', 'noopener,noreferrer')
      }

      void updateOrderStatus(order.id, status)
        .then(refresh)
        .catch((cause: unknown) => setError(errorMessage(cause)))
    },
    [autoNotify, refresh],
  )

  const discard = useCallback(
    (id: string) => {
      void removeOrder(id)
        .then(refresh)
        .catch((cause: unknown) => setError(errorMessage(cause)))
    },
    [refresh],
  )

  /** Só o que a navegação precisa mostrar como contador. */
  const counts = useMemo(
    () => ({
      ativos: orders.filter((order) => order.status !== 'concluido' && order.status !== 'cancelado')
        .length,
      entrega: orders.filter((order) => order.status === 'entrega').length,
    }),
    [orders],
  )

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

  const nav = useMemo(
    () => [
      { id: 'dashboard' as const, label: 'Dashboard', icon: <ChartIcon />, badge: 0 },
      { id: 'pedidos' as const, label: 'Pedidos', icon: <ReceiptIcon />, badge: counts.ativos },
      { id: 'entregas' as const, label: 'Entregas', icon: <ScooterIcon />, badge: counts.entrega },
      {
        id: 'estoque' as const,
        label: 'Estoque',
        icon: <BoxIcon />,
        // Insumos no mínimo ou zerados: é o que precisa de compra.
        badge: supplies.filter(needsRestock).length,
      },
      { id: 'cardapio' as const, label: 'Cardápio', icon: <GlobeIcon />, badge: 0 },
      { id: 'financeiro' as const, label: 'Financeiro', icon: <MoneyIcon />, badge: 0 },
      { id: 'avaliacoes' as const, label: 'Avaliações', icon: <StarIcon />, badge: 0 },
    ],
    [counts, supplies],
  )

  const userMenu = (
    <UserMenu
      tone="dark"
      email={email}
      onOpenAccount={() => setSection('conta')}
      onOpenSettings={() => setSection('config')}
      onSignOut={() => void signOut()}
    />
  )

  return (
    <div className="min-h-screen bg-white text-ink lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-acai-950 p-5 lg:flex lg:h-screen lg:sticky lg:top-0">
        <div className="flex items-center gap-3">
          <Logo className="size-12 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-white">{business.name}</p>
            <p className="text-xs text-acai-200">Sistema da loja</p>
          </div>
        </div>

        <nav aria-label="Seções do painel" className="mt-6">
          <ul className="space-y-1">
            {nav.map((item) => {
              const active = section === item.id
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSection(item.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                      active ? 'bg-white text-acai-900' : 'text-acai-100/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge > 0 && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          active ? 'bg-acai-100 text-acai-900' : 'bg-white/10 text-acai-100'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
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

        <div className="mt-auto pt-6">
          <a
            href="/"
            className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-acai-100/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            Ver site
          </a>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topo do desktop: mesma cor da lateral, com a conta à direita. */}
        <header className="sticky top-0 z-20 hidden items-center justify-between gap-4 border-b border-white/10 bg-acai-950 px-7 py-5 text-white lg:flex">
          <p className="text-base text-acai-200">
            <span className="text-lg font-extrabold text-white">{today.count}</span> pedidos hoje ·{' '}
            <span className="text-lg font-extrabold text-white">{formatPrice(today.revenue)}</span>
          </p>
          {userMenu}
        </header>

        {/* No celular a lateral vira topo compacto, com a mesma navegação. */}
        <header className="sticky top-0 z-20 bg-acai-950 px-5 py-4 text-white lg:hidden">
          <div className="flex items-center gap-3">
            <Logo className="size-11 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold">{business.name}</p>
              <p className="text-xs text-acai-200">
                {today.count} pedidos hoje · {formatPrice(today.revenue)}
              </p>
            </div>
            {userMenu}
          </div>

          <nav aria-label="Seções do painel" className="-mx-5 mt-3 overflow-x-auto px-5">
            <ul className="flex w-max gap-1.5">
              {nav.map((item) => {
                const active = section === item.id
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSection(item.id)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
                        active ? 'bg-white text-acai-900' : 'bg-white/10 text-acai-100'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                      {item.badge > 0 && <span className="opacity-70">{item.badge}</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
        </header>

        <main className="min-w-0 flex-1 px-5 py-6 lg:px-6">
          {error && (
            <p
              role="alert"
              className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-700"
            >
              {error}
            </p>
          )}

          {section === 'dashboard' && (
            <Dashboard
              orders={orders}
              onAdvance={advance}
              autoNotify={autoNotify}
              onOpenSettings={() => setSection('config')}
            />
          )}

          {section === 'pedidos' && (
            <OrdersView orders={orders} onAdvance={advance} onRemove={discard} />
          )}

          {section === 'entregas' && <DeliveriesView orders={orders} onAdvance={advance} />}
          {section === 'estoque' && <InventoryView />}
          {section === 'cardapio' && <MenuView />}
          {section === 'financeiro' && <FinanceView orders={orders} />}
          {section === 'avaliacoes' && <ReviewsView />}
          {section === 'conta' && <AccountView />}
          {section === 'config' && (
            <SettingsView autoNotify={autoNotify} onAutoNotifyChange={setAutoNotify} />
          )}
        </main>
      </div>
    </div>
  )
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0 fill-current">
      <path d="M4 20a1 1 0 0 1-1-1V5a1 1 0 1 1 2 0v13h15a1 1 0 1 1 0 2H4Zm4-3a1 1 0 0 1-1-1v-4a1 1 0 1 1 2 0v4a1 1 0 0 1-1 1Zm4.5 0a1 1 0 0 1-1-1V8a1 1 0 1 1 2 0v8a1 1 0 0 1-1 1Zm4.5 0a1 1 0 0 1-1-1v-5.5a1 1 0 1 1 2 0V16a1 1 0 0 1-1 1Z" />
    </svg>
  )
}

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0 fill-current">
      <path d="M6 2a1 1 0 0 0-1 1v18a1 1 0 0 0 1.5.9l2-1.2 2 1.2a1 1 0 0 0 1 0l2-1.2 2 1.2a1 1 0 0 0 1.5-.9V3a1 1 0 0 0-1-1H6Zm2.5 5h7a1 1 0 1 1 0 2h-7a1 1 0 0 1 0-2Zm0 4h7a1 1 0 1 1 0 2h-7a1 1 0 1 1 0-2Zm0 4h4a1 1 0 1 1 0 2h-4a1 1 0 1 1 0-2Z" />
    </svg>
  )
}

function ScooterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0 fill-current">
      <path d="M14 4a1 1 0 0 1 1-1h2.6a2 2 0 0 1 2 1.7l1.3 8.8a3.5 3.5 0 1 1-2 .3l-.2-1.3h-2.4a5 5 0 0 1-4.7 5H8.9a3.5 3.5 0 1 1-.4-2h2.7a3 3 0 0 0 2.8-3V5h-1a1 1 0 0 1-1-1Zm-8.5 12a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm13 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM16 5.6l.7 4.9h2.1l-.7-4.9H16ZM3 8a1 1 0 0 1 1-1h5a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm1 3.5a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Z" />
    </svg>
  )
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0 fill-current">
      <path d="M12 2.2a1 1 0 0 0-.5.1l-8 4A1 1 0 0 0 3 7.2v9.6a1 1 0 0 0 .5.9l8 4a1 1 0 0 0 1 0l8-4a1 1 0 0 0 .5-.9V7.2a1 1 0 0 0-.5-.9l-8-4a1 1 0 0 0-.5-.1Zm0 2.1 5.8 2.9L12 10.1 6.2 7.2 12 4.3ZM5 8.8l6 3v7.1l-6-3V8.8Zm8 10.1v-7.1l6-3v7.1l-6 3Z" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0 fill-current">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 9h-3a15.5 15.5 0 0 0-1.3-5.6A8 8 0 0 1 18.9 11ZM12 4.2c.8 1.1 1.7 3.3 1.9 6.8h-3.8c.2-3.5 1.1-5.7 1.9-6.8ZM9.4 5.4A15.5 15.5 0 0 0 8.1 11h-3a8 8 0 0 1 4.3-5.6ZM5.1 13h3a15.5 15.5 0 0 0 1.3 5.6A8 8 0 0 1 5.1 13Zm6.9 6.8c-.8-1.1-1.7-3.3-1.9-6.8h3.8c-.2 3.5-1.1 5.7-1.9 6.8Zm2.6-1.2a15.5 15.5 0 0 0 1.3-5.6h3a8 8 0 0 1-4.3 5.6Z" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current stroke-[1.8]">
      <path
        d="M12 3.5l2.7 5.5 6 .9-4.35 4.24 1.03 6-5.38-2.83L6.62 20l1.03-6L3.3 9.9l6-.9z"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MoneyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0 fill-current">
      <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Zm2 0v2a2 2 0 0 0 2-2H5Zm14 0h-2a2 2 0 0 0 2 2V6Zm0 12v-2a2 2 0 0 0-2 2h2ZM5 18h2a2 2 0 0 0-2-2v2Zm7-9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </svg>
  )
}
