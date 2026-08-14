import { formatPrice } from '../lib/order'
import { notifyUrl } from '../orders/messages'
import type { Order, OrderStatus } from '../orders/types'
import { nextStatus, paymentLabels, statusLabels } from '../orders/types'

interface OrderCardProps {
  readonly order: Order
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

const time = (iso: string): string =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

export function OrderCard({ order, onAdvance, onCancel, onRemove }: OrderCardProps) {
  const next = nextStatus(order.status)
  const { customer } = order
  const closed = order.status === 'concluido' || order.status === 'cancelado'

  return (
    <article className="rounded-card bg-white p-4 shadow-lg shadow-acai-950/30">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-extrabold text-ink">#{order.code}</p>
          <p className="text-xs text-muted">
            {time(order.createdAt)} · {customer.name}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[order.status]}`}>
          {statusLabels[order.status]}
        </span>
      </header>

      <ul className="mt-3 space-y-2 border-t border-acai-100 pt-3">
        {order.items.map((item) => (
          <li key={item.id} className="text-sm">
            <p className="font-bold text-ink">
              {item.quantity}x {item.size.name}
            </p>
            <p className="text-xs text-muted">
              {item.product.baseLabel}: {item.base.name}
              {item.toppings.length > 0 && ` · ${item.toppings.map((t) => t.name).join(', ')}`}
            </p>
          </li>
        ))}
      </ul>

      <dl className="mt-3 space-y-1 border-t border-acai-100 pt-3 text-xs">
        <div className="flex gap-2">
          <dt className="shrink-0 font-bold text-acai-700">Endereço</dt>
          <dd className="text-muted">
            {customer.address}
            {customer.reference && ` (${customer.reference})`}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 font-bold text-acai-700">Telefone</dt>
          <dd className="text-muted">{customer.phone}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 font-bold text-acai-700">Pagamento</dt>
          <dd className="text-muted">
            {paymentLabels[customer.payment]}
            {customer.changeFor && ` · troco para ${customer.changeFor}`}
          </dd>
        </div>
        {customer.notes && (
          <div className="flex gap-2">
            <dt className="shrink-0 font-bold text-acai-700">Obs.</dt>
            <dd className="text-muted">{customer.notes}</dd>
          </div>
        )}
      </dl>

      <div className="mt-3 border-t border-acai-100 pt-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-lg font-extrabold text-acai-800">{formatPrice(order.total)}</span>

          <div className="flex items-center gap-2">
            {closed ? (
              <button
                type="button"
                onClick={() => onRemove(order.id)}
                className="rounded-full px-3 py-2 text-xs font-semibold text-muted transition-colors hover:text-acai-800"
              >
                Arquivar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onCancel(order)}
                className="rounded-full px-3 py-2 text-xs font-semibold text-muted transition-colors hover:text-acai-800"
              >
                Cancelar
              </button>
            )}

            {next && (
              <button
                type="button"
                onClick={() => onAdvance(order, next)}
                className="rounded-full bg-acai-800 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-acai-900"
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
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-acai-200 px-4 py-2.5 text-xs font-bold text-acai-800 transition-colors hover:bg-acai-50"
        >
          <WhatsAppIcon />
          Avisar cliente ({statusLabels[order.status].toLowerCase()})
        </a>
      </div>
    </article>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
      <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.5.3-.4.8-1.4.1-.2 0-.4 0-.5s-.6-1.4-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.8.8-1 1.9-.6 3.1a11 11 0 0 0 4.6 5c1.6.7 2.3.8 3.1.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2Z" />
    </svg>
  )
}
