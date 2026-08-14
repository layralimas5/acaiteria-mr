import { formatPrice } from '../lib/order'
import type { Order, OrderStatus } from '../orders/types'
import { nextStatus, paymentLabels, statusLabels } from '../orders/types'

interface OrderCardProps {
  readonly order: Order
  readonly onAdvance: (id: string, status: OrderStatus) => void
  readonly onCancel: (id: string) => void
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

  return (
    <article className="rounded-card border border-acai-100 bg-white p-4 shadow-sm">
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

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-acai-100 pt-3">
        <span className="text-lg font-extrabold text-acai-800">{formatPrice(order.total)}</span>

        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/55${customer.phone.replace(/\D/g, '').replace(/^55/, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-acai-200 px-3 py-2 text-xs font-bold text-acai-800 transition-colors hover:bg-acai-50"
          >
            WhatsApp
          </a>

          {order.status === 'cancelado' || order.status === 'concluido' ? (
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
              onClick={() => onCancel(order.id)}
              className="rounded-full px-3 py-2 text-xs font-semibold text-muted transition-colors hover:text-acai-800"
            >
              Cancelar
            </button>
          )}

          {next && (
            <button
              type="button"
              onClick={() => onAdvance(order.id, next)}
              className="rounded-full bg-acai-800 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-acai-900"
            >
              {next === 'concluido' ? 'Dar baixa' : statusLabels[next]}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
