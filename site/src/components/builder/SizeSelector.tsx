import type { CupSize } from '../../data/builder'
import { formatPrice } from '../../lib/order'

interface SizeSelectorProps {
  readonly sizes: readonly CupSize[]
  readonly selected: CupSize | null
  readonly onSelect: (size: CupSize) => void
}

export function SizeSelector({ sizes, selected, onSelect }: SizeSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Tamanho do copo" className="grid gap-3 sm:grid-cols-3">
      {sizes.map((size) => {
        const isSelected = selected?.id === size.id

        return (
          <button
            key={size.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={!size.available}
            onClick={() => onSelect(size)}
            className={`group relative flex items-center gap-4 rounded-card border p-4 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45 sm:flex-col sm:items-start ${
              isSelected
                ? 'border-acai-700 bg-acai-50 ring-2 ring-acai-700'
                : 'border-acai-100 bg-white hover:border-acai-300 enabled:hover:animate-pulse-soft'
            }`}
          >
            {isSelected && <SelectedBadge />}

            <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-acai-900 sm:size-24 sm:w-full">
              {size.image ? (
                <img
                  src={size.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="size-full object-contain"
                />
              ) : (
                <span className="text-sm font-extrabold text-white">{size.volume}</span>
              )}
            </span>

            <span className="min-w-0">
              <span className="block text-base font-bold text-ink">{size.volume}</span>
              <span className="mt-0.5 block text-sm font-semibold text-acai-800">
                {formatPrice(size.basePrice)}
              </span>
              <span className="mt-1 block text-xs text-muted">
                {size.freeToppings} complementos grátis
              </span>
              {!size.available && (
                <span className="mt-1 block text-xs font-semibold text-muted">Indisponível hoje</span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function SelectedBadge() {
  return (
    <span
      aria-hidden="true"
      className="absolute right-3 top-3 grid size-6 animate-pulse-soft place-items-center rounded-full bg-acai-700 text-white [animation-iteration-count:1]"
    >
      <svg viewBox="0 0 20 20" className="size-3.5 fill-none stroke-current stroke-[2.5]">
        <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}
