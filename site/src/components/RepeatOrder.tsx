import { useState } from 'react'
import { useCart } from '../cart/CartContext'
import { formatPrice } from '../lib/order'
import { rebuildOrder } from '../lib/repeatOrder'
import type { LastOrder } from '../orders/lastOrder'
import { useCatalog } from '../catalog/useCatalog'

interface RepeatOrderProps {
  readonly lastOrder: LastOrder
  /** Some com o convite quando o cliente diz que hoje quer outra coisa. */
  readonly onDismiss: () => void
  readonly onRepeated: () => void
}

const relativeDay = (iso: string): string => {
  const then = new Date(iso)
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000)

  if (days <= 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 30) return `há ${days} dias`
  return then.toLocaleDateString('pt-BR')
}

/**
 * Atalho de recompra: quem já pediu daqui encontra o pedido anterior pronto
 * para repetir. Os itens são remontados contra o catálogo de hoje, então preço
 * novo e item esgotado aparecem antes de ir para o carrinho.
 */
export function RepeatOrder({ lastOrder, onDismiss, onRepeated }: RepeatOrderProps) {
  const { catalog } = useCatalog()
  const { addItems } = useCart()
  const [warning, setWarning] = useState<string | null>(null)

  const { items, dropped, droppedToppings } = rebuildOrder(lastOrder.items, catalog)
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const count = items.reduce((sum, item) => sum + item.quantity, 0)

  if (items.length === 0) return null

  const repeat = () => {
    addItems(items)

    const notices = [
      dropped.length > 0 ? `Fora do pedido hoje: ${dropped.join(', ')}.` : '',
      droppedToppings.length > 0 ? `Complementos esgotados: ${droppedToppings.join(', ')}.` : '',
    ].filter(Boolean)

    setWarning(notices.length > 0 ? notices.join(' ') : null)
    onRepeated()
  }

  return (
    <section aria-label="Repetir pedido anterior" className="bg-acai-50 py-8">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col gap-4 rounded-card border border-acai-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-acai-700">
              Seu último pedido · {relativeDay(lastOrder.createdAt)}
            </p>
            <p className="mt-1.5 truncate text-base font-extrabold text-ink sm:text-lg">
              {items.map((item) => `${item.quantity}x ${item.size.name}`).join(', ')}
            </p>
            <p className="mt-1 text-sm text-muted">
              {count} {count === 1 ? 'item' : 'itens'} · {formatPrice(total)}
              {dropped.length > 0 && ' · alguns itens saíram do cardápio'}
            </p>
            {warning && (
              <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                {warning}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={repeat}
              className="rounded-full bg-acai-800 px-6 py-3 text-sm font-bold text-white transition-colors hover:animate-pulse-soft hover:bg-acai-900"
            >
              Pedir de novo
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-full px-5 py-2.5 text-xs font-semibold text-muted transition-colors hover:text-acai-800"
            >
              Hoje quero outra coisa
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
