import { motion } from 'framer-motion'
import type { ProductKind } from '../../data/builder'
import { formatPrice } from '../../lib/order'
import { SelectedCheck } from './SelectedCheck'

interface ProductSelectorProps {
  readonly products: readonly ProductKind[]
  readonly selected: ProductKind | null
  readonly onSelect: (product: ProductKind) => void
}

/** Primeira escolha da jornada: açaí ou sorvete. */
export function ProductSelector({ products, selected, onSelect }: ProductSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Produto" className="grid gap-3 sm:grid-cols-2">
      {products.map((product) => {
        const isSelected = selected?.id === product.id
        const cheapest = product.sizes.reduce(
          (lowest, size) => Math.min(lowest, size.basePrice),
          Number.POSITIVE_INFINITY,
        )

        return (
          <motion.button
            key={product.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={!product.available}
            onClick={() => onSelect(product)}
            whileTap={product.available ? { scale: 0.98 } : undefined}
            className={`relative flex items-center gap-4 rounded-card border p-4 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${
              isSelected
                ? 'border-acai-800 bg-white shadow-xl shadow-acai-900/10 ring-2 ring-acai-800'
                : 'border-acai-100 bg-white hover:-translate-y-0.5 hover:border-acai-300 hover:shadow-lg hover:shadow-acai-900/5'
            }`}
          >
            {isSelected && <SelectedCheck />}

            <span
              className={`grid size-16 shrink-0 place-items-center rounded-2xl text-3xl transition-colors ${
                isSelected ? 'bg-acai-100' : 'bg-acai-50'
              }`}
            >
              <span aria-hidden="true">{product.emoji}</span>
            </span>

            <span className="min-w-0 pr-6">
              <span className="block text-lg font-extrabold leading-tight text-ink">{product.name}</span>
              <span className="mt-1 block text-sm leading-snug text-muted">{product.description}</span>
              <span className="mt-2 block text-xs font-bold text-acai-800">
                a partir de {formatPrice(cheapest)}
              </span>
              {!product.available && (
                <span className="mt-1 block text-xs font-semibold text-muted">Indisponível hoje</span>
              )}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
