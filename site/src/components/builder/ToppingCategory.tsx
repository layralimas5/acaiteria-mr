import type { Topping, ToppingCategory as Category } from '../../catalog/types'
import type { CategoryUsage } from '../../lib/builder'
import { categoryQuotaLabel } from '../../lib/builder'
import { ToppingCard } from './ToppingCard'

interface ToppingCategoryProps {
  readonly category: Category
  readonly toppings: readonly Topping[]
  readonly selectedIds: readonly string[]
  /** Complementos já escolhidos que ocupam a cota grátis, na ordem de escolha. */
  readonly freeIds: readonly string[]
  /** Cota e teto desta categoria, já com o que o cliente escolheu. */
  readonly usage: CategoryUsage
  readonly disabled: boolean
  readonly onToggle: (topping: Topping) => void
}

export function ToppingCategory({
  category,
  toppings,
  selectedIds,
  freeIds,
  usage,
  disabled,
  onToggle,
}: ToppingCategoryProps) {
  if (toppings.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-acai-200 p-6 text-center text-sm text-muted">
        Nenhum item disponível nessa categoria hoje.
      </p>
    )
  }

  const freeRemaining = Math.max(0, usage.free - usage.chosen)

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h4 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.14em] text-acai-800">
          {category.title}
          {usage.chosen > 0 && (
            <span className="rounded-full bg-acai-800 px-2 py-0.5 text-[11px] font-bold tracking-normal text-white">
              {usage.chosen}
            </span>
          )}
        </h4>
        <span className="text-xs text-muted">{category.subtitle}</span>
      </div>

      <p
        className={`mt-1 text-xs font-semibold ${
          usage.full ? 'text-amber-700' : usage.paid > 0 ? 'text-acai-800' : 'text-green-700'
        }`}
      >
        {categoryQuotaLabel(usage)}
        {usage.full && ' · limite atingido'}
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
        {toppings.map((topping) => {
          const selected = selectedIds.includes(topping.id)
          const free = selected ? freeIds.includes(topping.id) : freeRemaining > 0

          return (
            <ToppingCard
              key={topping.id}
              topping={topping}
              selected={selected}
              free={free}
              disabled={disabled}
              blockedByLimit={!selected && usage.full}
              onToggle={onToggle}
            />
          )
        })}
      </div>
    </div>
  )
}
