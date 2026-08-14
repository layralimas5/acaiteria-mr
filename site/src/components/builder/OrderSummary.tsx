import type { BuildPricing, BuildSelection } from '../../lib/builder'
import { missingSteps, toppingsLabel } from '../../lib/builder'
import { formatPrice } from '../../lib/order'

interface OrderSummaryProps {
  readonly selection: BuildSelection
  readonly pricing: BuildPricing
  readonly onAdd: () => void
  readonly onReset: () => void
}

export function OrderSummary({ selection, pricing, onAdd, onReset }: OrderSummaryProps) {
  const missing = missingSteps(selection)
  const paidIds = pricing.paidToppings.map((topping) => topping.id)

  return (
    <aside className="rounded-card border border-acai-100 bg-white p-6 shadow-sm lg:sticky lg:top-28">
      <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-acai-700">Seu açaí</h3>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-start justify-between gap-4">
          <dt className="text-muted">Tamanho</dt>
          <dd className="text-right font-semibold text-ink">
            {selection.size ? selection.size.volume : '—'}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="text-muted">Base</dt>
          <dd className="text-right font-semibold text-ink">{selection.base?.name ?? '—'}</dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="text-muted">Complementos</dt>
          <dd className="text-right font-semibold text-ink">{selection.toppings.length}</dd>
        </div>
      </dl>

      {selection.toppings.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {selection.toppings.map((topping) => {
            const paid = paidIds.includes(topping.id)
            return (
              <li
                key={topping.id}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  paid ? 'bg-acai-100 text-acai-800' : 'bg-green-50 text-green-700'
                }`}
              >
                {topping.name}
                {paid && ` +${formatPrice(topping.price)}`}
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-4 rounded-xl bg-acai-50 px-3 py-2 text-xs font-semibold text-acai-800">
        {toppingsLabel(selection, pricing)}
      </p>

      <dl className="mt-5 space-y-2 border-t border-acai-100 pt-5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Preço base</dt>
          <dd className="font-semibold text-ink">{formatPrice(pricing.basePrice)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Adicionais</dt>
          <dd className="font-semibold text-ink">{formatPrice(pricing.additionalPrice)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-acai-100 pt-3">
          <dt className="text-base font-bold text-ink">Total</dt>
          <dd className="text-xl font-extrabold text-acai-800">{formatPrice(pricing.totalPrice)}</dd>
        </div>
      </dl>

      {missing.length > 0 && (
        <p role="status" className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          Falta: {missing.join(' e ')}.
        </p>
      )}

      <button
        type="button"
        onClick={onAdd}
        disabled={missing.length > 0}
        className="mt-5 w-full rounded-full bg-acai-800 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:animate-pulse-soft hover:bg-acai-900 disabled:cursor-not-allowed disabled:bg-acai-200 disabled:text-acai-800"
      >
        Adicionar ao carrinho
      </button>

      <button
        type="button"
        onClick={onReset}
        className="mt-2 w-full rounded-full px-6 py-2 text-xs font-semibold text-muted transition-colors hover:text-acai-800"
      >
        Começar de novo
      </button>
    </aside>
  )
}
