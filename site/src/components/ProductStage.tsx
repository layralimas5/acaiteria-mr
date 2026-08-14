import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Product } from '../data/products'
import type { DragState } from './AcaiCup3D'
import { ProductVisual } from './ProductVisual'

const AcaiCup3D = lazy(() => import('./AcaiCup3D'))

interface ProductStageProps {
  readonly product: Product
  readonly className?: string
}

interface BoundaryProps {
  readonly fallback: ReactNode
  readonly children: ReactNode
}

/** Se o WebGL falhar em qualquer navegador, o banner cai para a imagem. */
class CanvasBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

interface NetworkInformation {
  readonly saveData?: boolean
  readonly effectiveType?: string
}

/** Em conexão lenta ou com economia de dados, não vale baixar o 3D. */
const connectionIsSlow = (): boolean => {
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection
  if (!connection) return false
  if (connection.saveData) return true
  return ['slow-2g', '2g', '3g'].includes(connection.effectiveType ?? '')
}

const supportsWebGL = (): boolean => {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export function ProductStage({ product, className = '' }: ProductStageProps) {
  const drag = useRef<DragState>({ dragging: false, pending: 0, velocity: 0 })
  const lastX = useRef(0)
  const [enabled, setEnabled] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    setEnabled(supportsWebGL() && !connectionIsSlow())

    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    drag.current.dragging = true
    drag.current.velocity = 0
    lastX.current = event.clientX
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [])

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.dragging) return
    drag.current.pending += (event.clientX - lastX.current) * 0.008
    lastX.current = event.clientX
  }, [])

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    drag.current.dragging = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }, [])

  const image = <ProductVisual product={product} priority className="h-full w-auto max-w-full" />

  if (!enabled) {
    return <div className={`flex items-center justify-center ${className}`}>{image}</div>
  }

  return (
    <div
      className={`relative touch-pan-y select-none ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <CanvasBoundary fallback={<div className="flex h-full items-center justify-center">{image}</div>}>
        <Suspense fallback={<div className="flex h-full items-center justify-center">{image}</div>}>
          <AcaiCup3D product={product} drag={drag} reducedMotion={reducedMotion} />
        </Suspense>
      </CanvasBoundary>

      <p className="pointer-events-none absolute inset-x-0 bottom-0 text-center text-xs font-medium text-acai-100/60">
        arraste para girar
      </p>
    </div>
  )
}
