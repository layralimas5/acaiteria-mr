import type { ReactNode } from 'react'
import type { Product } from '../data/products'
import { orderLabel, orderUrl } from '../lib/order'

type Variant = 'primary' | 'outline' | 'light' | 'outlineLight'

interface OrderButtonProps {
  readonly product?: Product
  readonly variant?: Variant
  readonly className?: string
  readonly children?: ReactNode
}

const styles: Record<Variant, string> = {
  primary: 'bg-acai-800 text-white shadow-lg shadow-acai-900/25 hover:bg-acai-900 active:bg-acai-950',
  outline: 'border border-acai-200 text-acai-800 hover:border-acai-400 hover:bg-acai-50',
  light: 'bg-white text-acai-900 shadow-lg shadow-acai-950/30 hover:bg-acai-50',
  outlineLight: 'border border-white/25 text-white hover:border-white/50 hover:bg-white/10',
}

export function OrderButton({ product, variant = 'primary', className = '', children }: OrderButtonProps) {
  const label = children ?? orderLabel()

  return (
    <a
      href={orderUrl(product)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors duration-200 hover:animate-pulse-soft ${styles[variant]} ${className}`}
    >
      {label}
      <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4 fill-none stroke-current stroke-2">
        <path d="M4 10h11M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  )
}
