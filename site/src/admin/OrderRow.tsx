import { formatPrice } from '../lib/order'
import type { Order, OrderStatus } from '../orders/types'
import { nextStatus, paymentLabels, statusLabels } from '../orders/types'
import { WaitBadge } from './WaitBadge'
import { formatTime } from './metrics'

/** Linha compacta do pedido, para quando a lista está grande. */

interface OrderRowProps {
  readonly order: Order
  readonly now: number
  readonly onAdvance: (order: Order, status: OrderStatus) => void
  readonly onOpen: () => void
}

const advanceLabels: Readonly<Record<OrderStatus, string>> = {
  novo: 'Aceitar',
  preparando: 'Saiu p/ entrega',
  entrega: 'Dar baixa',
  concluido: '',
  cancelado: '',
}

export function OrderRow({ order, now, onAdvance, onOpen }: OrderRowProps) {
  const next = nextStatus(order.status)
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0)
  const open = order.status !== 'concluido' && order.status !== 'cancelado'

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-acai-100 py-3 last:border-b-0">
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 text-left"
        aria-label={`Ver detalhes do pedido ${order.code}`}
      >
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-extrabold text-ink">#{order.code}</span>
          <span className="text-sm font-bold text-ink">{order.customer.name}</span>
          {open && <WaitBadge iso={order.createdAt} now={now} />}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted">
          {formatTime(order.createdAt)} · {itemCount} {itemCount === 1 ? 'item' : 'itens'} ·{' '}
          {paymentLabels[order.customer.payment]}
          {order.customer.changeFor && ` (troco p/ ${order.customer.changeFor})`} ·{' '}
          {order.customer.address}
        </span>
      </button>

      <span className="shrink-0 text-sm font-extrabold text-acai-800">
        {formatPrice(order.total)}
      </span>

      {next ? (
        <button
          type="button"
          onClick={() => onAdvance(order, next)}
          className="shrink-0 rounded-full bg-acai-800 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-acai-900"
        >
          {advanceLabels[order.status]}
        </button>
      ) : (
        <span className="shrink-0 rounded-full bg-acai-50 px-3 py-1.5 text-xs font-bold text-muted">
          {statusLabels[order.status]}
        </span>
      )}
    </li>
  )
}
