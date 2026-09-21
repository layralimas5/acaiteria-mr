import type { PaymentStatus } from '../orders/types'
import { paymentStatusLabels } from '../orders/types'

/**
 * Estado da cobrança online, na tela da loja.
 *
 * "Pago" aqui significa dinheiro confirmado pela InfinitePay, não promessa do
 * cliente: quem carimba é o servidor, depois de conferir a cobrança. É por
 * isso que a loja pode confiar nesse selo para começar a preparar.
 *
 * Pedido pago na entrega não mostra nada: não há cobrança para acompanhar, e
 * um selo a mais em todo card só tiraria a atenção dos que precisam dele.
 */
export function PaymentBadge({
  status,
  compact = false,
}: {
  readonly status: PaymentStatus | undefined
  readonly compact?: boolean
}) {
  if (!status || status === 'na_entrega') return null

  const styles: Readonly<Record<Exclude<PaymentStatus, 'na_entrega'>, string>> = {
    aguardando: 'bg-amber-100 text-amber-800',
    pago: 'bg-green-100 text-green-800',
    falhou: 'bg-red-100 text-red-700',
  }

  return (
    <span
      className={`shrink-0 rounded-full font-bold ${styles[status]} ${
        compact ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
      }`}
    >
      {status === 'pago' ? '✓ ' : ''}
      {paymentStatusLabels[status]}
    </span>
  )
}
