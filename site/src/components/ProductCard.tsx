import type { Product } from '../data/products'
import { formatPrice } from '../lib/order'
import { AcaiCup } from './AcaiCup'
import { OrderButton } from './OrderButton'

interface ProductCardProps {
  readonly product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-acai-100 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-acai-200 hover:shadow-xl hover:shadow-acai-900/5">
      <div className="relative flex items-center justify-center bg-gradient-to-b from-acai-50 to-white px-6 pb-4 pt-8">
        {product.highlight && (
          <span className="absolute left-4 top-4 rounded-full bg-acai-700 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            {product.highlight}
          </span>
        )}
        <AcaiCup label={product.size} className="h-36 w-auto transition-transform duration-300 group-hover:scale-105" />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold text-ink">{product.name}</h3>
          <span className="shrink-0 text-base font-extrabold text-acai-700">{formatPrice(product.price)}</span>
        </div>

        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{product.description}</p>

        {product.toppingsIncluded > 0 && (
          <p className="mt-3 text-xs font-semibold text-acai-600">
            {product.toppingsIncluded} {product.toppingsIncluded === 1 ? 'complemento incluso' : 'complementos inclusos'}
          </p>
        )}

        <OrderButton product={product} variant="outline" className="mt-5 w-full">
          Pedir
        </OrderButton>
      </div>
    </article>
  )
}
