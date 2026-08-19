import { formatPrice } from '../lib/order'
import { notifyUrl } from '../orders/messages'
import type { Order, OrderStatus } from '../orders/types'
import { nextStatus, paymentLabels, statusFlow, statusLabels } from '../orders/types'
import { WaitBadge } from './WaitBadge'

interface OrderCardProps {
  readonly order: Order
  /** Relógio da tela, para o tempo de espera andar sozinho. */
  readonly now: number
  /** Destaca o card recém-aberto a partir da lista compacta. */
  readonly highlight?: boolean
  readonly onAdvance: (order: Order, status: OrderStatus) => void
  readonly onCancel: (order: Order) => void
  readonly onRemove: (id: string) => void
}

const statusStyles: Readonly<Record<OrderStatus, string>> = {
  novo: 'bg-amber-100 text-amber-800',
  preparando: 'bg-acai-100 text-acai-800',
  entrega: 'bg-blue-100 text-blue-800',
  concluido: 'bg-green-100 text-green-800',
  cancelado: 'bg-acai-50 text-muted',
}

/** Nome curto de cada etapa, para caber embaixo da bolinha. */
const stepLabels: Readonly<Record<OrderStatus, string>> = {
  novo: 'Novo',
  preparando: 'Preparo',
  entrega: 'Entrega',
  concluido: 'Entregue',
  cancelado: 'Cancelado',
}

const time = (iso: string): string =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

export function OrderCard({
  order,
  now,
  highlight = false,
  onAdvance,
  onCancel,
  onRemove,
}: OrderCardProps) {
  const next = nextStatus(order.status)
  const { customer } = order
  const closed = order.status === 'concluido' || order.status === 'cancelado'
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0)

  return (
    <article
      className={`flex flex-col rounded-card border bg-white p-5 shadow-sm transition duration-200 hover:border-acai-200 hover:shadow-md ${
        highlight ? 'border-acai-500 ring-2 ring-acai-200' : 'border-acai-100'
      }`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-xl font-extrabold text-ink">#{order.code}</span>
            {!closed && <WaitBadge iso={order.createdAt} now={now} />}
          </p>
          <p className="mt-0.5 text-sm text-muted">
            {time(order.createdAt)} · {customer.name} · {itemCount}{' '}
            {itemCount === 1 ? 'item' : 'itens'}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusStyles[order.status]}`}
        >
          {statusLabels[order.status]}
        </span>
      </header>

      <StatusSteps status={order.status} />

      {order.confirmedAt && (
        <p className="mt-3 rounded-2xl bg-green-50 px-4 py-2 text-center text-xs font-bold text-green-700">
          Cliente confirmou o recebimento às {time(order.confirmedAt)}
        </p>
      )}

      <ul className="mt-4 space-y-2.5 border-t border-acai-100 pt-4">
        {order.items.map((item) => (
          <li key={item.id}>
            <p className="text-base font-bold text-ink">
              {item.quantity}x {item.size.name}
            </p>
            <p className="mt-0.5 text-sm text-muted">
              {item.product.baseLabel}: {item.base.name}
              {item.toppings.length > 0 && ` · ${item.toppings.map((t) => t.name).join(', ')}`}
            </p>
            {item.notes && (
              <p className="mt-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-sm font-semibold text-amber-800">
                Obs.: {item.notes}
              </p>
            )}
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-2 border-t border-acai-100 pt-4 text-sm">
        <Detail label="Endereço">
          {customer.address}
          {customer.reference && ` (${customer.reference})`}
        </Detail>
        <Detail label="Telefone">{customer.phone}</Detail>
        <Detail label="Pagamento">
          {paymentLabels[customer.payment]}
          {customer.changeFor && (
            <span className="font-bold text-amber-700"> · troco para {customer.changeFor}</span>
          )}
        </Detail>
        {customer.notes && <Detail label="Obs.">{customer.notes}</Detail>}
      </dl>

      <div className="mt-auto border-t border-acai-100 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>
            <span className="block text-2xl font-extrabold text-acai-800">{formatPrice(order.total)}</span>
            {order.deliveryFee !== undefined && (
              <span className="block text-xs text-muted">
                {formatPrice(order.subtotal ?? order.total - order.deliveryFee)} em itens
                {order.deliveryFee > 0
                  ? ` + ${formatPrice(order.deliveryFee)} de entrega`
                  : ' · entrega grátis'}
              </span>
            )}
          </span>

          <div className="flex items-center gap-2">
            {closed ? (
              <button
                type="button"
                onClick={() => onRemove(order.id)}
                className="rounded-full px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-acai-800"
              >
                Arquivar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onCancel(order)}
                className="rounded-full px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-acai-800"
              >
                Cancelar
              </button>
            )}

            {next && (
              <button
                type="button"
                onClick={() => onAdvance(order, next)}
                className="rounded-full bg-acai-800 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-acai-900"
              >
                {next === 'concluido' ? 'Dar baixa' : statusLabels[next]}
              </button>
            )}
          </div>
        </div>

        <a
          href={notifyUrl(order, order.status)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-acai-200 px-4 py-3 text-sm font-bold text-acai-800 transition-colors hover:bg-acai-50"
        >
          <WhatsAppIcon />
          Avisar cliente ({statusLabels[order.status].toLowerCase()})
        </a>
      </div>
    </article>
  )
}

/** Trilha das quatro etapas, com a atual destacada e as anteriores marcadas. */
function StatusSteps({ status }: { readonly status: OrderStatus }) {
  if (status === 'cancelado') {
    return (
      <p className="mt-4 rounded-2xl bg-acai-50 px-4 py-2.5 text-center text-sm font-bold text-muted">
        Pedido cancelado
      </p>
    )
  }

  const current = statusFlow.indexOf(status)

  return (
    <ol
      className="mt-4 flex items-start"
      aria-label={`Etapa atual: ${statusLabels[status]}`}
    >
      {statusFlow.map((step, index) => {
        const done = index < current
        const active = index === current

        return (
          <li key={step} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <span
                className={`h-0.5 flex-1 ${index === 0 ? 'bg-transparent' : done || active ? 'bg-acai-500' : 'bg-acai-100'}`}
              />
              <span
                aria-hidden="true"
                className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-extrabold transition-colors ${
                  active
                    ? 'bg-acai-800 text-white ring-4 ring-acai-100'
                    : done
                      ? 'bg-acai-500 text-white'
                      : 'bg-acai-100 text-muted'
                }`}
              >
                {done ? '✓' : index + 1}
              </span>
              <span
                className={`h-0.5 flex-1 ${index === statusFlow.length - 1 ? 'bg-transparent' : done ? 'bg-acai-500' : 'bg-acai-100'}`}
              />
            </div>
            <span
              className={`mt-1.5 text-[11px] font-bold ${active ? 'text-acai-800' : 'text-muted'}`}
            >
              {stepLabels[step]}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function Detail({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 shrink-0 font-bold text-acai-700">{label}</dt>
      <dd className="min-w-0 text-muted">{children}</dd>
    </div>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
      <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.5.3-.4.8-1.4.1-.2 0-.4 0-.5s-.6-1.4-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.8.8-1 1.9-.6 3.1a11 11 0 0 0 4.6 5c1.6.7 2.3.8 3.1.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2Z" />
    </svg>
  )
}
