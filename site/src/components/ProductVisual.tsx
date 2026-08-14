import type { CSSProperties } from 'react'
import type { Product } from '../data/products'
import { AcaiCup } from './AcaiCup'

interface ProductVisualProps {
  readonly product: Product
  readonly className?: string
  /** Gira o produto continuamente. Usado só no banner. */
  readonly spin?: boolean
  readonly priority?: boolean
}

/**
 * A foto do produto vem com fundo roxo sólido, então a máscara radial dissolve
 * as bordas e o produto se funde ao banner. Como a máscara é circular e gira
 * junto com a imagem, a silhueta não muda durante a rotação.
 */
const fadeEdges: CSSProperties = {
  maskImage:
    'radial-gradient(closest-side circle, #000 62%, rgba(0,0,0,0.55) 82%, transparent 100%)',
  WebkitMaskImage:
    'radial-gradient(closest-side circle, #000 62%, rgba(0,0,0,0.55) 82%, transparent 100%)',
}

export function ProductVisual({ product, className = '', spin = false, priority = false }: ProductVisualProps) {
  if (!product.image) {
    return <AcaiCup label={product.size} className={className} />
  }

  return (
    <img
      src={product.image}
      alt={`${product.name} da Açaiteria MR`}
      width={900}
      height={900}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      style={fadeEdges}
      className={`select-none object-contain ${spin ? 'animate-spin-slow' : ''} ${className}`}
    />
  )
}
