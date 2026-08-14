import { motion } from 'framer-motion'
import type { Topping } from '../../data/builder'
import { formatPrice } from '../../lib/order'
import { SelectedCheck } from './SelectedCheck'

interface ToppingCardProps {
  readonly topping: Topping
  readonly selected: boolean
  /** true quando esse complemento ainda cabe na cota grátis do tamanho. */
  readonly free: boolean
  readonly disabled: boolean
  readonly onToggle: (topping: Topping) => void
}

export function ToppingCard({ topping, selected, free, disabled, onToggle }: ToppingCardProps) {
  const unavailable = !topping.available
  const blocked = unavailable || disabled

  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      disabled={blocked}
      onClick={() => onToggle(topping)}
      whileTap={blocked ? undefined : { scale: 0.95 }}
      className={`relative flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-center transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
        selected
          ? 'border-acai-800 bg-white shadow-lg shadow-acai-900/10 ring-2 ring-acai-800'
          : 'border-acai-100 bg-white hover:-translate-y-0.5 hover:border-acai-300 hover:shadow-md'
      }`}
    >
      {selected && <SelectedCheck size="sm" className="right-2 top-2" />}

      <span
        className={`grid size-14 place-items-center overflow-hidden rounded-full text-2xl transition-colors ${
          selected ? 'bg-acai-100' : 'bg-acai-50'
        }`}
      >
        {topping.image ? (
          <img src={topping.image} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
        ) : (
          <span aria-hidden="true">{topping.emoji}</span>
        )}
      </span>

      <span className="text-sm font-bold leading-tight text-ink">{topping.name}</span>

      <span
        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
          unavailable
            ? 'bg-acai-50 text-muted'
            : free
              ? 'bg-green-50 text-green-700'
              : 'bg-acai-50 text-acai-800'
        }`}
      >
        {unavailable ? 'Esgotado' : free ? 'Grátis' : `+ ${formatPrice(topping.price)}`}
      </span>
    </motion.button>
  )
}
