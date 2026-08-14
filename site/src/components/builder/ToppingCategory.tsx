import type { Topping, ToppingCategory as Category } from '../../data/builder'
import { ToppingCard } from './ToppingCard'

interface ToppingCategoryProps {
  readonly category: Category
  readonly toppings: readonly Topping[]
  readonly selectedIds: readonly string[]
  /** Complementos já escolhidos que ocupam a cota grátis, na ordem de escolha. */
  readonly freeIds: readonly string[]
  readonly freeRemaining: number
  readonly disabled: boolean
  readonly onToggle: (topping: Topping) => void
}

export function ToppingCategory({
  category,
  toppings,
  selectedIds,
  freeIds,
  freeRemaining,
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

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-acai-700">{category.title}</h4>
        <span className="text-xs text-muted">{category.subtitle}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
              onToggle={onToggle}
            />
          )
        })}
      </div>
    </div>
  )
}
