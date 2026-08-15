import { useMemo } from 'react'
import { business } from '../config/business'
import { formatPrice } from '../lib/order'
import { notifyUrl } from '../orders/messages'
import type { Order, OrderStatus } from '../orders/types'
import { paymentLabels } from '../orders/types'
import { formatTime, startOfDay, sum } from './metrics'

/**
 * Entregas: quem está pronto para sair, quem já está na rua e o que o
 * entregador precisa saber em cada endereço.
 */

interface DeliveriesViewProps {
  readonly orders: readonly Order[]
  readonly onAdvance: (order: Order, status: OrderStatus) => void
}

const mapsUrl = (order: Order): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${order.customer.address}, ${business.address.city}, ${business.address.state}`,
  )}`

const whatsappUrl = (order: Order): string =>
  `https://wa.me/55${order.customer.phone.replace(/\D/g, '').replace(/^55/, '')}`

export function DeliveriesView({ orders, onAdvance }: DeliveriesViewProps) {
  const prontos = useMemo(
    () => orders.filter((order) => order.status === 'preparando'),
    [orders],
  )
  const naRua = useMemo(() => orders.filter((order) => order.status === 'entrega'), [orders])

  const entreguesHoje = useMemo(() => {
    const start = startOfDay(0)
    return orders.filter(
      (order) => order.status === 'concluido' && new Date(order.createdAt) >= start,
    )
  }, [orders])

  /** Dinheiro que o entregador leva na mão e precisa voltar para o caixa. */
  const naMao = useMemo(
    () => sum(naRua.filter((order) => order.customer.payment !== 'pix')),
    [naRua],
  )

  return (
    <>
      <h1 className="text-xl font-extrabold text-ink">Entregas</h1>
      <p className="mt-1 text-sm text-muted">
        Tempo médio combinado com o cliente: {business.delivery.averageMinutes} minutos.
      </p>

      <section aria-label="Resumo" className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Prontos para sair" value={String(prontos.length)} accent="text-acai-700" />
        <Stat label="Na rua agora" value={String(naRua.length)} accent="text-sky-600" />
        <Stat label="Entregues hoje" value={String(entreguesHoje.length)} accent="text-emerald-600" />
        <Stat label="A receber na entrega" value={formatPrice(naMao)} accent="text-amber-600" />
      </section>

      <Group
        title="Na rua agora"
        empty="Nenhum pedido na rua. Os que saírem aparecem aqui."
        orders={naRua}
        action="Dar baixa · entregue"
        nextStatus="concluido"
        onAdvance={onAdvance}
      />

      <Group
        title="Prontos para sair"
        empty="Nada pronto no momento. Assim que a cozinha liberar, entra aqui."
        orders={prontos}
        action="Saiu para entrega"
        nextStatus="entrega"
        onAdvance={onAdvance}
      />
    </>
  )
}

function Group({
  title,
  empty,
  orders,
  action,
  nextStatus,
  onAdvance,
}: {
  readonly title: string
  readonly empty: string
  readonly orders: readonly Order[]
  readonly action: string
  readonly nextStatus: OrderStatus
  readonly onAdvance: (order: Order, status: OrderStatus) => void
}) {
  return (
    <section className="mt-6">
      <h2 className="text-sm font-extrabold text-ink">
        {title}
        <span className="ml-2 text-xs font-semibold text-muted">{orders.length}</span>
      </h2>

      {orders.length === 0 ? (
        <p className="mt-3 rounded-card border border-dashed border-acai-200 p-8 text-center text-sm text-muted">
          {empty}
        </p>
      ) : (
        <div className="mt-3 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {orders.map((order) => (
            <DeliveryCard
              key={order.id}
              order={order}
              action={action}
              onAdvance={() => onAdvance(order, nextStatus)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function DeliveryCard({
  order,
  action,
  onAdvance,
}: {
  readonly order: Order
  readonly action: string
  readonly onAdvance: () => void
}) {
  const { customer } = order

  return (
    <article className="rounded-card border border-acai-100 bg-white p-4 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-extrabold text-ink">#{order.code}</p>
          <p className="truncate text-xs text-muted">
            {formatTime(order.createdAt)} · {customer.name}
          </p>
        </div>
        <span className="shrink-0 text-sm font-extrabold text-acai-800">
          {formatPrice(order.total)}
        </span>
      </header>

      <p className="mt-3 border-t border-acai-100 pt-3 text-sm font-bold text-ink">
        {customer.address}
      </p>
      {customer.reference && <p className="text-xs text-muted">Referência: {customer.reference}</p>}

      <p className="mt-2 text-xs text-muted">
        {paymentLabels[customer.payment]}
        {customer.changeFor && (
          <span className="font-bold text-amber-700"> · levar troco para {customer.changeFor}</span>
        )}
      </p>
      {customer.notes && <p className="mt-1 text-xs text-muted">Obs.: {customer.notes}</p>}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={mapsUrl(order)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-acai-200 px-3 py-2 text-center text-xs font-bold text-acai-800 transition-colors hover:bg-acai-50"
        >
          Ver no mapa
        </a>
        <a
          href={whatsappUrl(order)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-acai-200 px-3 py-2 text-center text-xs font-bold text-acai-800 transition-colors hover:bg-acai-50"
        >
          Chamar cliente
        </a>
      </div>

      <button
        type="button"
        onClick={onAdvance}
        className="mt-2 w-full rounded-full bg-acai-800 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-acai-900"
      >
        {action}
      </button>

      <a
        href={notifyUrl(order, order.status)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block text-center text-[11px] font-semibold text-muted underline underline-offset-2 hover:text-acai-800"
      >
        Reenviar aviso da etapa atual
      </a>
    </article>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  readonly label: string
  readonly value: string
  readonly accent: string
}) {
  return (
    <article className="rounded-card border border-acai-100 bg-white p-5 shadow-sm transition duration-200 hover:border-acai-200 hover:shadow-md motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.02]">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className={`mt-2 text-3xl font-extrabold tracking-tight ${accent}`}>{value}</p>
    </article>
  )
}
