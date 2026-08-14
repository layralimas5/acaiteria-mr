import type { ReactNode } from 'react'
import type { Product } from '../data/products'
import { hasIfood, orderUrl } from '../lib/order'

type Variant = 'primary' | 'outline' | 'ghost'

interface OrderButtonProps {
  readonly product?: Product
  readonly variant?: Variant
  readonly className?: string
  readonly children?: ReactNode
}

const styles: Record<Variant, string> = {
  primary:
    'bg-acai-700 text-white shadow-lg shadow-acai-700/20 hover:bg-acai-800 active:bg-acai-900',
  outline: 'border border-acai-200 text-acai-700 hover:border-acai-400 hover:bg-acai-50',
  ghost: 'text-acai-700 hover:bg-acai-50',
}

export function OrderButton({ product, variant = 'primary', className = '', children }: OrderButtonProps) {
  const label = children ?? (hasIfood() ? 'Peça no iFood' : 'Pedir no WhatsApp')

  return (
    <a
      href={orderUrl(product)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors duration-200 ${styles[variant]} ${className}`}
    >
      {label}
      <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4 fill-none stroke-current stroke-2">
        <path d="M4 10h11M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  )
}
