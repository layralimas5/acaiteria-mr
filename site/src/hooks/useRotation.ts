import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

export interface Rotation {
  readonly index: number
  readonly goTo: (index: number) => void
  /** true quando o visitante pediu menos movimento: o rodízio fica parado. */
  readonly paused: boolean
}

/**
 * Rodízio de peças em tempo fixo. Com menos de duas peças, ou quando o
 * visitante pede movimento reduzido, fica parado na primeira.
 */
export function useRotation(length: number, intervalMs: number): Rotation {
  const reduceMotion = useReducedMotion() ?? false
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (length < 2 || reduceMotion) return

    const timer = window.setInterval(() => setIndex((current) => (current + 1) % length), intervalMs)
    return () => window.clearInterval(timer)
  }, [length, intervalMs, reduceMotion])

  return { index, goTo: setIndex, paused: reduceMotion }
}
