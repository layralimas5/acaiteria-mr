import { useCallback, useEffect, useRef, useState } from 'react'
import { business } from '../config/business'
import { formatPrice, whatsappUrl } from '../lib/order'
import type { LastOrder } from '../orders/lastOrder'
import { paymentLink, paymentStatusOf } from '../orders/payment'
import type { PaymentStatus } from '../orders/types'

interface PaymentReturnProps {
  readonly order: LastOrder
  readonly onDismiss: () => void
}

/**
 * A InfinitePay devolve o cliente para cá assim que ele termina de pagar, e o
 * aviso de que o pagamento caiu chega à loja por outro caminho — o webhook,
 * servidor a servidor. Os dois são independentes, então o retorno pode chegar
 * primeiro. Por isso esta tela não acredita na URL: pergunta ao banco, e
 * pergunta de novo por alguns segundos enquanto a resposta for "aguardando".
 */
const POLL_INTERVAL_MS = 2000
const POLL_ATTEMPTS = 8

const firstName = (name: string): string => name.trim().split(' ')[0] ?? name

const paidMessage = (order: LastOrder): string =>
  `*${business.name}: pedido #${order.code} pago* ✅\n\n${order.customer.name} pagou ${formatPrice(order.total)} pelo site.`

export function PaymentReturn({ order, onDismiss }: PaymentReturnProps) {
  const [status, setStatus] = useState<PaymentStatus | 'consultando'>('consultando')
  const [retrying, setRetrying] = useState(false)
  const attempts = useRef(0)

  useEffect(() => {
    let alive = true
    let timer: number | undefined

    const ask = (): void => {
      void paymentStatusOf(order.code).then((current) => {
        if (!alive) return
        attempts.current += 1

        if (current === 'pago' || current === 'falhou') {
          setStatus(current)
          return
        }

        // Ainda não caiu: tenta de novo, até desistir e deixar a tela dizer
        // que está processando, em vez de girar para sempre.
        if (attempts.current >= POLL_ATTEMPTS) {
          setStatus(current ?? 'aguardando')
          return
        }
        timer = window.setTimeout(ask, POLL_INTERVAL_MS)
      })
    }

    ask()

    return () => {
      alive = false
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [order.code])

  /** Pagamento recusado ou abandonado: abre o checkout de novo, mesmo pedido. */
  const payAgain = useCallback(() => {
    setRetrying(true)
    paymentLink(order.code)
      .then((url) => {
        window.location.href = url
      })
      .catch(() => setRetrying(false))
  }, [order.code])

  const paid = status === 'pago'
  const failed = status === 'falhou'

  return (
    <section aria-label="Resultado do pagamento" className="bg-white pt-8">
      <div className="mx-auto max-w-6xl px-5">
        <div
          className={`rounded-card border p-5 shadow-sm sm:p-6 ${
            paid ? 'border-green-200 bg-green-50' : failed ? 'border-red-200 bg-red-50' : 'border-acai-200 bg-acai-50'
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-acai-700">
            Pedido #{order.code}
          </p>

          <h2 className="mt-1.5 text-lg font-extrabold text-ink sm:text-xl">
            {paid
              ? `Pagamento confirmado, ${firstName(order.customer.name)}!`
              : failed
                ? 'O pagamento não foi concluído'
                : 'Conferindo seu pagamento...'}
          </h2>

          <p className="mt-1 text-sm text-muted">
            {paid
              ? `Recebemos ${formatPrice(order.total)}. A loja já foi avisada e começa a preparar seu pedido. Ele chega a partir de ${business.delivery.minMinutes} minutos.`
              : failed
                ? 'Nada foi cobrado. Você pode tentar de novo agora ou combinar o pagamento na entrega pelo WhatsApp.'
                : 'Isso costuma levar poucos segundos. Pode deixar esta tela aberta.'}
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            {paid && (
              <a
                href={whatsappUrl(paidMessage(order))}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-acai-800 px-6 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-acai-900"
              >
                Avisar a loja no WhatsApp
              </a>
            )}

            {failed && (
              <button
                type="button"
                onClick={payAgain}
                disabled={retrying}
                className="rounded-full bg-acai-800 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-acai-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {retrying ? 'Abrindo...' : 'Tentar pagar de novo'}
              </button>
            )}

            {!paid && (
              <a
                href={whatsappUrl(`Oi! Aqui é ${order.customer.name}. Sobre o pedido #${order.code}:`)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-acai-200 bg-white px-5 py-3 text-center text-sm font-semibold text-acai-800 transition-colors hover:bg-white/60"
              >
                Falar com a loja
              </a>
            )}

            <button
              type="button"
              onClick={onDismiss}
              className="rounded-full px-4 py-3 text-xs font-semibold text-muted transition-colors hover:text-acai-800 sm:ml-auto"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
