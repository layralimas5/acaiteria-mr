import { motion } from 'framer-motion'
import type { CupSize } from '../../data/builder'
import { formatPrice } from '../../lib/order'
import { SelectedCheck } from './SelectedCheck'

interface SizeSelectorProps {
  readonly sizes: readonly CupSize[]
  readonly selected: CupSize | null
  readonly onSelect: (size: CupSize) => void
}

export function SizeSelector({ sizes, selected, onSelect }: SizeSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Tamanho do copo" className="grid gap-3 sm:grid-cols-3">
      {sizes.map((size, index) => {
        const isSelected = selected?.id === size.id

        return (
          <motion.button
            key={size.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={!size.available}
            onClick={() => onSelect(size)}
            whileTap={size.available ? { scale: 0.98 } : undefined}
            className={`group relative flex items-center gap-4 overflow-hidden rounded-card border p-3 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45 sm:flex-col sm:items-stretch sm:p-4 ${
              isSelected
                ? 'border-acai-800 bg-white shadow-xl shadow-acai-900/10 ring-2 ring-acai-800'
                : 'border-acai-100 bg-white hover:-translate-y-0.5 hover:border-acai-300 hover:shadow-lg hover:shadow-acai-900/5'
            }`}
          >
            {isSelected && <SelectedCheck />}

            {/* A foto preenche o quadro: o fundo roxo do estúdio vira o fundo do card. */}
            <span className="grid aspect-square size-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-acai-900 sm:size-auto sm:w-full">
              {size.image ? (
                <img
                  src={size.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className={`size-full object-cover transition-transform duration-500 ${
                    isSelected ? 'scale-[1.06]' : 'group-hover:scale-[1.06]'
                  }`}
                />
              ) : (
                <span className="text-xl font-extrabold text-white/90">{size.volume}</span>
              )}
            </span>

            <span className="min-w-0 sm:mt-3">
              <span className="flex items-baseline gap-2">
                <span className="text-lg font-extrabold tracking-tight text-ink">{size.volume}</span>
                {index === 1 && (
                  <span className="rounded-full bg-acai-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-acai-800">
                    Mais pedido
                  </span>
                )}
              </span>

              <span className="mt-0.5 block text-base font-bold text-acai-800">
                {formatPrice(size.basePrice)}
              </span>

              <span className="mt-2 inline-block whitespace-nowrap rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">
                {size.freeToppings} complementos grátis
              </span>

              {!size.available && (
                <span className="mt-2 block text-xs font-semibold text-muted">Indisponível hoje</span>
              )}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
