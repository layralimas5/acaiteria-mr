import { motion } from 'framer-motion'
import type { AcaiBase } from '../../catalog/types'
import { formatPrice } from '../../lib/order'
import { SelectedCheck } from './SelectedCheck'

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
          <motion.button
            key={base.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={!base.available}
            onClick={() => onSelect(base)}
            whileTap={base.available ? { scale: 0.98 } : undefined}
            className={`relative flex items-start gap-3 rounded-card border p-4 pr-12 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${
              isSelected
                ? 'border-acai-800 bg-white shadow-xl shadow-acai-900/10 ring-2 ring-acai-800'
                : 'border-acai-100 bg-white hover:-translate-y-0.5 hover:border-acai-300 hover:shadow-lg hover:shadow-acai-900/5'
            }`}
          >
            {isSelected && <SelectedCheck />}

            <span
              aria-hidden="true"
              className={`mt-0.5 size-3 shrink-0 rounded-full transition-colors ${
                isSelected ? 'bg-acai-800' : 'bg-acai-200'
              }`}
            />

            <span className="min-w-0">
              <span className="block text-base font-bold leading-tight text-ink">{base.name}</span>
              <span className="mt-1 block text-sm leading-snug text-muted">{base.description}</span>
              <span
                className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-bold ${
                  base.extraPrice > 0 ? 'bg-acai-50 text-acai-800' : 'bg-green-50 text-green-700'
                }`}
              >
                {base.extraPrice > 0 ? `+ ${formatPrice(base.extraPrice)}` : 'Sem custo extra'}
              </span>
              {!base.available && (
                <span className="mt-2 block text-xs font-semibold text-muted">Indisponível hoje</span>
              )}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
