import type { BuildPricing, BuildSelection } from '../../lib/builder'
import { missingSteps } from '../../lib/builder'
import { formatPrice } from '../../lib/order'

interface MobileOrderBarProps {
  readonly selection: BuildSelection
  readonly pricing: BuildPricing
  readonly cartCount: number
  readonly onAdd: () => void
  readonly onOpenCart: () => void
}

/** Barra fixa do celular: preço em tempo real de um lado, ação do outro. */
export function MobileOrderBar({ selection, pricing, cartCount, onAdd, onOpenCart }: MobileOrderBarProps) {
  const missing = missingSteps(selection)
  const blocked = missing.length > 0

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-acai-100 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted">
            {blocked ? `Falta ${missing[0]}` : `${selection.size?.volume} · ${selection.base?.name}`}
          </p>
          <p className="text-base font-extrabold text-ink">
            Seu açaí • {formatPrice(pricing.totalPrice)}
          </p>
        </div>

        {cartCount > 0 && (
          <button
            type="button"
            onClick={onOpenCart}
            className="shrink-0 rounded-full border border-acai-200 px-4 py-3 text-sm font-bold text-acai-800"
          >
            Ver pedido ({cartCount})
          </button>
        )}

        <button
          type="button"
          onClick={onAdd}
          disabled={blocked}
          className="shrink-0 rounded-full bg-acai-800 px-5 py-3 text-sm font-bold text-white disabled:bg-acai-200 disabled:text-acai-800"
        >
          Adicionar
        </button>
      </div>
    </div>
  )
}
