import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { BuildPricing, BuildSelection } from '../../lib/builder'
import { missingSteps } from '../../lib/builder'
import { formatPrice } from '../../lib/order'
import { FreeToppingsMeter } from './FreeToppingsMeter'

interface MobileOrderBarProps {
  readonly selection: BuildSelection
  readonly pricing: BuildPricing
  readonly cartCount: number
  readonly onAdd: () => void
  /** Muda conforme a etapa: leva ao resumo ou fecha o pedido. */
  readonly addLabel?: string
  readonly onOpenCart: () => void
}

/**
 * Barra fixa do celular. Fechada mostra preço e ação; ao tocar no resumo ela
 * sobe e revela a montagem inteira, sem sair da página.
 */
export function MobileOrderBar({
  selection,
  pricing,
  cartCount,
  onAdd,
  addLabel = 'Adicionar',
  onOpenCart,
}: MobileOrderBarProps) {
  const [expanded, setExpanded] = useState(false)
  const missing = missingSteps(selection)
  const blocked = missing.length > 0
  const paidIds = pricing.paidToppings.map((topping) => topping.id)

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <AnimatePresence>
        {expanded && (
          <motion.button
            type="button"
            aria-label="Fechar resumo"
            onClick={() => setExpanded(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 -z-10 size-full bg-acai-950/50 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <div className="rounded-t-3xl border-t border-acai-100 bg-white shadow-[0_-8px_30px_rgba(26,11,41,0.12)]">
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="max-h-[52vh] overflow-y-auto px-5 pt-5">
                <dl className="space-y-2.5 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Tamanho</dt>
                    <dd className="font-bold text-ink">{selection.size?.volume ?? 'a escolher'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Base</dt>
                    <dd className="font-bold text-ink">{selection.base?.name ?? 'a escolher'}</dd>
                  </div>
                </dl>

                {selection.size && (
                  <div className="mt-4 border-t border-acai-100 pt-4">
                    <FreeToppingsMeter limit={pricing.freeLimit} chosen={selection.toppings.length} />
                  </div>
                )}

                {selection.toppings.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {selection.toppings.map((topping) => {
                      const paid = paidIds.includes(topping.id)
                      return (
                        <li
                          key={topping.id}
                          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            paid ? 'bg-acai-50 text-acai-800' : 'bg-green-50 text-green-700'
                          }`}
                        >
                          <span aria-hidden="true">{topping.emoji}</span>
                          {topping.name}
                          {paid && <span className="font-bold">+{formatPrice(topping.price)}</span>}
                        </li>
                      )
                    })}
                  </ul>
                )}

                <dl className="mt-4 space-y-1.5 border-t border-acai-100 pt-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Preço base</dt>
                    <dd className="font-semibold text-ink">{formatPrice(pricing.basePrice)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Adicionais</dt>
                    <dd className="font-semibold text-ink">{formatPrice(pricing.additionalPrice)}</dd>
                  </div>
                </dl>

                {cartCount > 0 && (
                  <button
                    type="button"
                    onClick={onOpenCart}
                    className="mt-4 w-full rounded-full border border-acai-200 px-6 py-3 text-sm font-bold text-acai-800"
                  >
                    Ver pedido ({cartCount})
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <span className="min-w-0">
              <span className="flex items-center gap-1 truncate text-xs text-muted">
                {blocked ? `Falta ${missing[0]}` : `${selection.size?.volume} · ${selection.base?.name}`}
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className={`size-3.5 shrink-0 fill-none stroke-current stroke-2 transition-transform ${
                    expanded ? 'rotate-180' : ''
                  }`}
                >
                  <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="block truncate text-lg font-extrabold text-ink">
                Seu açaí • {formatPrice(pricing.totalPrice)}
              </span>
            </span>
          </button>

          {cartCount > 0 && !expanded && (
            <button
              type="button"
              onClick={onOpenCart}
              aria-label={`Ver pedido com ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`}
              className="grid size-11 shrink-0 place-items-center rounded-full border border-acai-200 text-sm font-bold text-acai-800"
            >
              {cartCount}
            </button>
          )}

          <motion.button
            type="button"
            onClick={onAdd}
            disabled={blocked}
            whileTap={blocked ? undefined : { scale: 0.96 }}
            className="shrink-0 rounded-full bg-acai-800 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-acai-900/20 disabled:bg-acai-100 disabled:text-acai-300 disabled:shadow-none"
          >
            {addLabel}
          </motion.button>
        </div>
      </div>
    </div>
  )
}
