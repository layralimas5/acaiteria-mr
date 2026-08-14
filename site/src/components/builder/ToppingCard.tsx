import type { Topping } from '../../data/builder'
import { formatPrice } from '../../lib/order'

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

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={unavailable || disabled}
      onClick={() => onToggle(topping)}
      className={`relative flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${
        selected
          ? 'border-acai-700 bg-acai-50 ring-2 ring-acai-700'
          : 'border-acai-100 bg-white hover:border-acai-300 enabled:hover:animate-pulse-soft'
      }`}
    >
      {selected && (
        <span
          aria-hidden="true"
          className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-acai-700 text-white"
        >
          <svg viewBox="0 0 20 20" className="size-3 fill-none stroke-current stroke-[3]">
            <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}

      <span className="grid size-12 place-items-center overflow-hidden rounded-full bg-acai-50 text-xl">
        {topping.image ? (
          <img src={topping.image} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
        ) : (
          <span aria-hidden="true">{topping.emoji}</span>
        )}
      </span>

      <span className="text-sm font-semibold leading-tight text-ink">{topping.name}</span>

      <span className={`text-xs font-bold ${free && !unavailable ? 'text-green-700' : 'text-acai-800'}`}>
        {unavailable ? 'Esgotado' : free ? 'Grátis' : `+ ${formatPrice(topping.price)}`}
      </span>
    </button>
  )
}
