import { motion } from 'framer-motion'
import type { Topping } from '../../catalog/types'
import { formatPrice } from '../../lib/order'
import { SelectedCheck } from './SelectedCheck'

interface ToppingCardProps {
  readonly topping: Topping
  readonly selected: boolean
  /** true quando esse complemento ainda cabe na cota grátis do tamanho. */
  readonly free: boolean
  readonly disabled: boolean
  /** true quando a categoria bateu o teto e este item ficou de fora. */
  readonly blockedByLimit?: boolean
  readonly onToggle: (topping: Topping) => void
}

export function ToppingCard({
  topping,
  selected,
  free,
  disabled,
  blockedByLimit = false,
  onToggle,
}: ToppingCardProps) {
  const unavailable = !topping.available
  const blocked = unavailable || disabled || blockedByLimit

  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      disabled={blocked}
      onClick={() => onToggle(topping)}
      whileTap={blocked ? undefined : { scale: 0.95 }}
      className={`relative flex flex-col items-center gap-1.5 rounded-2xl border px-1.5 py-3 text-center transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 sm:gap-2 sm:px-2 sm:py-4 ${
        selected
          ? 'border-acai-800 bg-white shadow-lg shadow-acai-900/10 ring-2 ring-acai-800'
          : 'border-acai-100 bg-white hover:-translate-y-0.5 hover:border-acai-300 hover:shadow-md'
      }`}
    >
      {selected && <SelectedCheck size="sm" className="right-2 top-2" />}

      <span
        className={`grid size-11 place-items-center overflow-hidden rounded-full text-xl transition-colors sm:size-14 sm:text-2xl ${
          selected ? 'bg-acai-100' : 'bg-acai-50'
        }`}
      >
        {topping.image ? (
          <img src={topping.image} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
        ) : (
          <span aria-hidden="true">{topping.emoji}</span>
        )}
      </span>

      <span className="text-xs font-bold leading-tight text-ink sm:text-sm">{topping.name}</span>

      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold sm:px-2 sm:text-[11px] ${
          unavailable
            ? 'bg-acai-50 text-muted'
            : free
              ? 'bg-green-50 text-green-700'
              : 'bg-acai-50 text-acai-800'
        }`}
      >
        {unavailable ? 'Esgotado' : blockedByLimit ? 'No limite' : free ? 'Grátis' : `+ ${formatPrice(topping.price)}`}
      </span>
    </motion.button>
  )
}
