import { useMemo, useState } from 'react'
import { formatPrice } from '../lib/order'
import type { Order, OrderStatus, PaymentMethod } from '../orders/types'
import { nextStatus, paymentLabels, statusLabels } from '../orders/types'
import type { Period } from './metrics'
import { formatTime, inPeriod, isOpen, moneyOf, paymentsOf, sum } from './metrics'
import { PeriodFilter } from './PeriodFilter'

/**
 * Visão geral da operação: a fila de pedidos com a baixa de status, quantos
 * pedidos estão em cada etapa, quanto entrou e como o cliente pagou.
 */

interface DashboardProps {
  readonly orders: readonly Order[]
  /** Avança o pedido para a próxima etapa e avisa o cliente. */
  readonly onAdvance: (order: Order, status: OrderStatus) => void
  /** Se o aviso no WhatsApp dispara junto com a baixa. */
  readonly autoNotify: boolean
  readonly onOpenSettings: () => void
}

const paymentBars: Readonly<Record<PaymentMethod, string>> = {
  pix: 'bg-emerald-500',
  dinheiro: 'bg-amber-500',
  cartao: 'bg-sky-500',
}

const queueStyles: Readonly<Record<'novo' | 'preparando' | 'entrega', string>> = {
  novo: 'bg-amber-100 text-amber-800',
  preparando: 'bg-acai-100 text-acai-800',
  entrega: 'bg-sky-100 text-sky-800',
}

/** O que o botão de baixa faz a partir de cada etapa. */
const advanceLabels: Readonly<Record<'novo' | 'preparando' | 'entrega', string>> = {
  novo: 'Aceitar e preparar',
  preparando: 'Saiu para entrega',
  entrega: 'Dar baixa · entregue',
}

export function Dashboard({ orders, onAdvance, autoNotify, onOpenSettings }: DashboardProps) {
  const [period, setPeriod] = useState<Period>({ id: 'hoje' })

  const scoped = useMemo(() => inPeriod(orders, period), [orders, period])

  /** A fila ignora o período: o que está aberto precisa sair hoje. */
  const queue = useMemo(
    () =>
      orders
        .filter(isOpen)
        .slice()
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [orders],
  )

  const groups = useMemo(() => {
    const aguardando = scoped.filter((order) => order.status === 'novo')
    const processando = scoped.filter(
      (order) => order.status === 'preparando' || order.status === 'entrega',
    )
    const entregues = scoped.filter((order) => order.status === 'concluido')
    const cancelados = scoped.filter((order) => order.status === 'cancelado')
    return { aguardando, processando, entregues, cancelados }
  }, [scoped])

  const money = useMemo(() => moneyOf(scoped), [scoped])
  const payments = useMemo(() => paymentsOf(scoped), [scoped])

  /** Pedidos em dinheiro ainda em aberto: a loja precisa separar o troco. */
  const trocos = useMemo(
    () =>
      scoped.filter(
        (order) => order.customer.payment === 'dinheiro' && order.customer.changeFor.trim() !== '' && isOpen(order),
      ),
    [scoped],
  )

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Os indicadores seguem o período; a fila mostra sempre tudo que está em aberto.
          </p>
        </div>

        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      <section aria-label="Pedidos por etapa" className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Aguardando"
          hint="Novos, ainda não aceitos"
          count={groups.aguardando.length}
          value={sum(groups.aguardando)}
          accent="text-amber-600"
        />
        <StatCard
          label="Processando"
          hint="Em preparo ou saiu para entrega"
          count={groups.processando.length}
          value={sum(groups.processando)}
          accent="text-sky-600"
        />
        <StatCard
          label="Entregues"
          hint="Pedidos concluídos"
          count={groups.entregues.length}
          value={sum(groups.entregues)}
          accent="text-emerald-600"
        />
        <StatCard
          label="Cancelados"
          hint="Não entram no faturamento"
          count={groups.cancelados.length}
          value={money.perdido}
          accent="text-muted"
        />
      </section>

      <section
        aria-label="Fila de pedidos"
        className="mt-6 rounded-card border border-acai-100 bg-white p-5 shadow-sm"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-extrabold text-ink">
            Fila de pedidos
            <span className="ml-2 text-xs font-semibold text-muted">{queue.length} em aberto</span>
          </h2>
          <p className="text-xs text-muted">
            {autoNotify ? (
              'A cada baixa, o WhatsApp do cliente abre com o aviso pronto.'
            ) : (
              <>
                O aviso automático está desligado.{' '}
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="font-bold text-acai-700 underline underline-offset-2 hover:text-acai-900"
                >
                  Ligar em Configurações
                </button>
              </>
            )}
          </p>
        </div>

        {queue.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-acai-200 p-8 text-center text-sm text-muted">
            Nenhum pedido em aberto. Os novos entram aqui sozinhos.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-acai-100">
            {queue.map((order) => (
              <QueueRow key={order.id} order={order} onAdvance={onAdvance} />
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Pagamento" className="mt-6 grid gap-4 lg:grid-cols-5">
        <div className="rounded-card border border-acai-100 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-extrabold text-ink">Dinheiro</h2>

          <p className="mt-4 text-3xl font-extrabold tracking-tight text-acai-800">
            {formatPrice(money.faturamento)}
          </p>
          <p className="text-xs text-muted">Faturamento do período</p>

          <dl className="mt-5 space-y-3 border-t border-acai-100 pt-4 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted">Recebido</dt>
              <dd className="font-extrabold text-emerald-600">{formatPrice(money.recebido)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted">A receber</dt>
              <dd className="font-extrabold text-amber-600">{formatPrice(money.aReceber)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted">Ticket médio</dt>
              <dd className="font-extrabold text-ink">{formatPrice(money.ticket)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-card border border-acai-100 bg-white p-5 shadow-sm lg:col-span-3">
          <h2 className="text-sm font-extrabold text-ink">Formas de pagamento</h2>

          {money.faturamento === 0 ? (
            <p className="mt-4 text-sm text-muted">
              Nenhum pedido no período. Assim que entrar o primeiro, a divisão aparece aqui.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {payments.map((item) => (
                <li key={item.method}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-bold text-ink">{paymentLabels[item.method]}</span>
                    <span className="text-muted">
                      <span className="font-extrabold text-ink">{formatPrice(item.valor)}</span>
                      {' · '}
                      {item.count} {item.count === 1 ? 'pedido' : 'pedidos'}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-2 overflow-hidden rounded-full bg-acai-100"
                    role="img"
                    aria-label={`${paymentLabels[item.method]}: ${item.share}% do faturamento`}
                  >
                    <div
                      className={`h-full rounded-full transition-[width] ${paymentBars[item.method]}`}
                      style={{ width: `${item.share}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {trocos.length > 0 && (
            <div className="mt-5 border-t border-acai-100 pt-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-600">
                Troco a separar
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {trocos.map((order) => (
                  <li key={order.id} className="flex flex-wrap justify-between gap-x-3">
                    <span className="text-muted">
                      #{order.code} · {order.customer.name}
                    </span>
                    <span className="font-bold text-ink">
                      {formatPrice(order.total)} → troco p/ {order.customer.changeFor}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

function QueueRow({
  order,
  onAdvance,
}: {
  readonly order: Order
  readonly onAdvance: (order: Order, status: OrderStatus) => void
}) {
  const next = nextStatus(order.status)
  const stage = order.status as 'novo' | 'preparando' | 'entrega'
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0)

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-ink">#{order.code}</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${queueStyles[stage]}`}>
            {statusLabels[order.status]}
          </span>
        </p>
        <p className="mt-0.5 truncate text-xs text-muted">
          {formatTime(order.createdAt)} · {order.customer.name} · {itemCount}{' '}
          {itemCount === 1 ? 'item' : 'itens'} · {paymentLabels[order.customer.payment]}
        </p>
      </div>

      <span className="text-sm font-extrabold text-acai-800">{formatPrice(order.total)}</span>

      {next && (
        <button
          type="button"
          onClick={() => onAdvance(order, next)}
          className="rounded-full bg-acai-800 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-acai-900"
        >
          {advanceLabels[stage]}
        </button>
      )}
    </li>
  )
}

interface StatCardProps {
  readonly label: string
  readonly hint: string
  readonly count: number
  readonly value: number
  readonly accent: string
}

function StatCard({ label, hint, count, value, accent }: StatCardProps) {
  return (
    <article className="rounded-card border border-acai-100 bg-white p-5 shadow-sm transition duration-200 hover:border-acai-200 hover:shadow-md motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.02]">
      <p className={`text-xs font-bold uppercase tracking-[0.14em] ${accent}`}>{label}</p>
      <p className="mt-2 text-4xl font-extrabold tracking-tight text-ink">{count}</p>
      <p className="mt-1 text-sm font-bold text-acai-800">{formatPrice(value)}</p>
      <p className="mt-2 text-[11px] leading-snug text-muted">{hint}</p>
    </article>
  )
}
