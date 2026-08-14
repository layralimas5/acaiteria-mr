import type { AcaiBase } from '../../data/builder'
import { formatPrice } from '../../lib/order'
import { SelectedBadge } from './SizeSelector'

interface BaseSelectorProps {
  readonly bases: readonly AcaiBase[]
  readonly selected: AcaiBase | null
  readonly onSelect: (base: AcaiBase) => void
}

export function BaseSelector({ bases, selected, onSelect }: BaseSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Base do açaí" className="grid gap-3 sm:grid-cols-2">
      {bases.map((base) => {
        const isSelected = selected?.id === base.id

        return (
          <button
            key={base.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={!base.available}
            onClick={() => onSelect(base)}
            className={`relative rounded-card border p-4 pr-12 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${
              isSelected
                ? 'border-acai-700 bg-acai-50 ring-2 ring-acai-700'
                : 'border-acai-100 bg-white hover:border-acai-300 enabled:hover:animate-pulse-soft'
            }`}
          >
            {isSelected && <SelectedBadge />}

            <span className="block text-base font-bold text-ink">{base.name}</span>
            <span className="mt-1 block text-sm text-muted">{base.description}</span>
            <span className="mt-2 block text-xs font-semibold text-acai-800">
              {base.extraPrice > 0 ? `+ ${formatPrice(base.extraPrice)}` : 'Sem custo extra'}
            </span>
            {!base.available && (
              <span className="mt-1 block text-xs font-semibold text-muted">Indisponível hoje</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
