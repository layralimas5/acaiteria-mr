import { AnimatePresence, motion } from 'framer-motion'
import type { BuildPricing, BuildSelection } from '../../lib/builder'
import { missingSteps } from '../../lib/builder'
import { formatPrice } from '../../lib/order'
import { FreeToppingsMeter } from './FreeToppingsMeter'

interface OrderSummaryProps {
  readonly selection: BuildSelection
  readonly pricing: BuildPricing
  readonly onAdd: () => void
  readonly onReset: () => void
}

export function OrderSummary({ selection, pricing, onAdd, onReset }: OrderSummaryProps) {
  const missing = missingSteps(selection)
  const paidIds = pricing.paidToppings.map((topping) => topping.id)
  const started = Boolean(selection.product ?? selection.size) || selection.toppings.length > 0

  return (
    <aside className="overflow-hidden rounded-card border border-acai-100 bg-white shadow-xl shadow-acai-900/5 lg:sticky lg:top-28">
      <header className="bg-acai-900 px-6 py-5 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-acai-200">
          {selection.product ? `Seu ${selection.product.name.toLowerCase()}` : 'Seu pedido'}
        </p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight">{formatPrice(pricing.totalPrice)}</p>
        <p className="mt-1 text-xs text-acai-100/70">
          {started ? 'Atualiza conforme você monta' : 'Comece escolhendo o produto'}
        </p>
      </header>

      <div className="px-6 py-5">
        <ul className="space-y-3 text-sm">
          <SummaryRow label="Produto" value={selection.product?.name ?? null} />
          <SummaryRow label="Tamanho" value={selection.size?.volume ?? null} />
          <SummaryRow label={selection.product?.baseLabel ?? 'Base'} value={selection.base?.name ?? null} />
        </ul>

        <div className="mt-5 border-t border-acai-100 pt-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-ink">Complementos</span>
            <span className="text-sm font-bold text-ink">{selection.toppings.length}</span>
          </div>

          {selection.size ? (
            <div className="mt-3">
              <FreeToppingsMeter limit={pricing.freeLimit} chosen={selection.toppings.length} />
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted">Escolha o tamanho para liberar a cota grátis.</p>
          )}

          <AnimatePresence initial={false}>
            {selection.toppings.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="mt-4 flex flex-wrap gap-1.5 overflow-hidden"
              >
                {selection.toppings.map((topping) => {
                  const paid = paidIds.includes(topping.id)
                  return (
                    <motion.li
                      key={topping.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        paid ? 'bg-acai-50 text-acai-800' : 'bg-green-50 text-green-700'
                      }`}
                    >
                      <span aria-hidden="true">{topping.emoji}</span>
                      {topping.name}
                      {paid && <span className="font-bold">+{formatPrice(topping.price)}</span>}
                    </motion.li>
                  )
                })}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        <dl className="mt-5 space-y-2 border-t border-acai-100 pt-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Preço base</dt>
            <dd className="font-semibold text-ink">{formatPrice(pricing.basePrice)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Adicionais</dt>
            <dd className={`font-semibold ${pricing.additionalPrice > 0 ? 'text-acai-800' : 'text-muted'}`}>
              {formatPrice(pricing.additionalPrice)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-acai-100 pt-3">
            <dt className="text-base font-bold text-ink">Total</dt>
            <dd className="text-2xl font-extrabold text-acai-800">{formatPrice(pricing.totalPrice)}</dd>
          </div>
        </dl>

        {missing.length > 0 && (
          <p
            role="status"
            className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-800"
          >
            <span aria-hidden="true">!</span>
            Falta {missing.join(' e ')}.
          </p>
        )}

        <button
          type="button"
          onClick={onAdd}
          disabled={missing.length > 0}
          className="mt-5 w-full rounded-full bg-acai-800 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-acai-900/20 transition-colors hover:animate-pulse-soft hover:bg-acai-900 disabled:cursor-not-allowed disabled:bg-acai-100 disabled:text-acai-300 disabled:shadow-none"
        >
          Adicionar ao carrinho
        </button>

        {started && (
          <button
            type="button"
            onClick={onReset}
            className="mt-2 w-full rounded-full px-6 py-2 text-xs font-semibold text-muted transition-colors hover:text-acai-800"
          >
            Começar de novo
          </button>
        )}
      </div>
    </aside>
  )
}

function SummaryRow({ label, value }: { readonly label: string; readonly value: string | null }) {
  return (
    <li className="flex items-center justify-between gap-4">
      <span className="text-muted">{label}</span>
      {value ? (
        <span className="text-right font-bold text-ink">{value}</span>
      ) : (
        <span className="text-right text-xs font-semibold text-acai-300">a escolher</span>
      )}
    </li>
  )
}
