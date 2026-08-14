import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../cart/CartContext'
import type { CartItem } from '../cart/CartContext'
import { formatPrice, isPreLaunch, launchLabel, whatsappUrl } from '../lib/order'

interface CartDrawerProps {
  readonly open: boolean
  readonly onClose: () => void
}

const describeItem = (item: CartItem): string => {
  const toppings = item.toppings.length > 0
    ? item.toppings.map((topping) => topping.name).join(', ')
    : 'sem complementos'
  return `${item.quantity}x ${item.size.name} — ${item.base.name} (${toppings}) — ${formatPrice(item.unitPrice * item.quantity)}`
}

/** Monta a mensagem do pedido para o WhatsApp, que hoje é o canal de venda. */
const orderMessage = (items: readonly CartItem[], total: number): string => {
  const lines = items.map(describeItem).join('\n')
  const intro = isPreLaunch()
    ? `Oi! Quero deixar meu pedido reservado para a inauguração (${launchLabel()}):`
    : 'Oi! Quero fazer esse pedido:'

  return `${intro}\n\n${lines}\n\nTotal: ${formatPrice(total)}`
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, total, count, increment, decrement, remove, clear } = useCart()

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Seu pedido">
          <motion.button
            type="button"
            aria-label="Fechar pedido"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 size-full bg-acai-950/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between gap-4 border-b border-acai-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-extrabold text-ink">Seu pedido</h2>
                <p className="text-xs text-muted">
                  {count === 0 ? 'Nenhum item ainda' : `${count} ${count === 1 ? 'item' : 'itens'}`}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="grid size-9 place-items-center rounded-xl border border-acai-100 text-acai-800"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 stroke-current stroke-2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="text-base font-bold text-ink">Seu pedido está vazio</p>
                  <p className="mt-2 max-w-xs text-sm text-muted">
                    Monte um açaí ou sorvete do seu jeito, escolhendo tamanho, sabor e complementos.
                  </p>
                  <a
                    href="#monte-seu-acai"
                    onClick={onClose}
                    className="mt-5 rounded-full bg-acai-800 px-6 py-3 text-sm font-bold text-white"
                  >
                    Montar meu pedido
                  </a>
                </div>
              ) : (
                <ul className="space-y-4">
                  {items.map((item) => (
                    <li key={item.id} className="rounded-card border border-acai-100 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-ink">{item.size.name}</p>
                          <p className="text-xs text-muted">
                            {item.product.baseLabel}: {item.base.name}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-extrabold text-acai-800">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </p>
                      </div>

                      {item.toppings.length > 0 && (
                        <p className="mt-2 text-xs leading-relaxed text-muted">
                          {item.toppings.map((topping) => topping.name).join(' · ')}
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => decrement(item.id)}
                            aria-label={`Diminuir ${item.size.name}`}
                            className="grid size-8 place-items-center rounded-full border border-acai-200 text-acai-800"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm font-bold text-ink">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => increment(item.id)}
                            aria-label={`Aumentar ${item.size.name}`}
                            className="grid size-8 place-items-center rounded-full border border-acai-200 text-acai-800"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => remove(item.id)}
                          className="text-xs font-semibold text-muted transition-colors hover:text-acai-800"
                        >
                          Remover
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <footer className="border-t border-acai-100 px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted">Total</span>
                  <span className="text-xl font-extrabold text-acai-800">{formatPrice(total)}</span>
                </div>

                <a
                  href={whatsappUrl(orderMessage(items, total))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex w-full items-center justify-center rounded-full bg-acai-800 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:animate-pulse-soft hover:bg-acai-900"
                >
                  {isPreLaunch() ? 'Reservar pelo WhatsApp' : 'Enviar pedido pelo WhatsApp'}
                </a>

                <button
                  type="button"
                  onClick={clear}
                  className="mt-2 w-full rounded-full px-6 py-2 text-xs font-semibold text-muted transition-colors hover:text-acai-800"
                >
                  Esvaziar pedido
                </button>
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
