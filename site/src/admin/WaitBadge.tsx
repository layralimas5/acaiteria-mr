import { business } from '../config/business'
import { minutesSince, waitLabel } from './metrics'

/**
 * Há quanto tempo o pedido está esperando. Passa a alertar conforme se
 * aproxima do tempo de entrega prometido ao cliente.
 */

interface WaitBadgeProps {
  readonly iso: string
  readonly now: number
}

export function WaitBadge({ iso, now }: WaitBadgeProps) {
  const minutes = minutesSince(iso, now)
  const limit = business.delivery.minMinutes

  const tone =
    minutes >= limit
      ? 'bg-red-100 text-red-800'
      : minutes >= limit * 0.6
        ? 'bg-amber-100 text-amber-800'
        : 'bg-acai-50 text-muted'

  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${tone}`}
      title={
        minutes >= limit
          ? `Passou dos ${limit} minutos prometidos`
          : `Tempo prometido: ${limit} minutos`
      }
    >
      {waitLabel(minutes)}
    </span>
  )
}
