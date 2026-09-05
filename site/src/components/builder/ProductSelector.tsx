import { motion } from 'framer-motion'
import type { ProductKind } from '../../catalog/types'
import { formatPrice } from '../../lib/order'
import { SelectedCheck } from './SelectedCheck'

interface ProductSelectorProps {
  readonly products: readonly ProductKind[]
  readonly selected: ProductKind | null
  readonly onSelect: (product: ProductKind) => void
}

/** Primeira escolha da jornada: qual produto do cardápio. */
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
            onClick={() => onSelect(product)}
            whileTap={{ scale: 0.98 }}
            className={`relative flex items-center gap-3 rounded-card border p-3 text-left transition-all duration-200 sm:gap-4 sm:p-4 ${
              isSelected
                ? 'border-acai-800 bg-white shadow-xl shadow-acai-900/10 ring-2 ring-acai-800'
                : 'border-acai-100 bg-white hover:-translate-y-0.5 hover:border-acai-300 hover:shadow-lg hover:shadow-acai-900/5'
            }`}
          >
            {isSelected && <SelectedCheck />}

            <span
              className={`grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl text-2xl transition-colors sm:size-16 sm:text-3xl ${
                isSelected ? 'bg-acai-100' : 'bg-acai-50'
              }`}
            >
              {product.image ? (
                <img src={product.image} alt="" loading="lazy" className="size-full object-cover" />
              ) : (
                <span aria-hidden="true">{product.emoji}</span>
              )}
            </span>

            <span className="min-w-0 pr-6">
              <span className="block text-base font-extrabold leading-tight text-ink sm:text-lg">{product.name}</span>
              <span className="mt-1 block text-xs leading-snug text-muted sm:text-sm">{product.description}</span>
              <span className="mt-2 block text-xs font-bold text-acai-800">
                a partir de {formatPrice(cheapest)}
              </span>
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
