import { business } from '../config/business'
import { whatsappUrl } from '../lib/order'
import { markConfirmed } from '../orders/confirmation'
import type { LastOrder } from '../orders/lastOrder'
import { confirmOrder } from '../orders/store'

interface OrderConfirmProps {
  readonly order: LastOrder
  /** Cliente confirmou que recebeu: é a deixa para pedir a avaliação. */
  readonly onConfirmed: () => void
  /** Fecha o card sem confirmar (pedido ainda não chegou, ou dispensa). */
  readonly onDismiss: () => void
}

const firstName = (name: string): string => name.trim().split(' ')[0] ?? name

/** Aviso que a loja recebe quando o cliente confirma o recebimento. */
const confirmMessage = (order: LastOrder): string =>
  `*${business.name}: pedido #${order.code} recebido* ✅\n\n${order.customer.name} confirmou que o pedido chegou.`

/** Aviso que a loja recebe quando o pedido não chegou. */
const missingMessage = (order: LastOrder): string =>
  `Oi! Aqui é ${order.customer.name}. Meu pedido #${order.code} ainda não chegou.`

const openWhatsApp = (message: string): void => {
  window.open(whatsappUrl(message), '_blank', 'noopener,noreferrer')
}

/**
 * Confirmação de recebimento, aberta pelo link que a loja manda ao dar baixa.
 *
 * A loja precisa saber que o açaí chegou de verdade, e o cliente que acabou de
 * receber é quem mais tem o que dizer. Por isso o "recebi" leva direto para os
 * depoimentos, com o formulário de avaliação já aberto.
 */
export function OrderConfirm({ order, onConfirmed, onDismiss }: OrderConfirmProps) {
  const confirm = () => {
    markConfirmed(order.code)

    // Carimba a confirmação no pedido, para a loja ver no painel quem já
    // recebeu. Se o banco não responder, o aviso ainda chega pelo WhatsApp,
    // então o fluxo do cliente não pode parar por causa disso.
    void confirmOrder(order.code).catch(() => undefined)

    openWhatsApp(confirmMessage(order))
    onConfirmed()
  }

  const report = () => {
    openWhatsApp(missingMessage(order))
    onDismiss()
  }

  return (
    <section aria-label="Confirmar o recebimento do pedido" className="bg-white pt-8">
      <div className="mx-auto max-w-6xl px-5">
        <div className="rounded-card border border-acai-200 bg-acai-50 p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-acai-700">
            Pedido #{order.code}
          </p>
          <h2 className="mt-1.5 text-lg font-extrabold text-ink sm:text-xl">
            Chegou tudo certo, {firstName(order.customer.name)}?
          </h2>
          <p className="mt-1 text-sm text-muted">
            Confirma o recebimento pra gente fechar o pedido. Leva um segundo.
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={confirm}
              className="rounded-full bg-acai-800 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-acai-900"
            >
              Recebi, tudo certo
            </button>
            <button
              type="button"
              onClick={report}
              className="rounded-full border border-acai-200 bg-white px-5 py-3 text-sm font-semibold text-acai-800 transition-colors hover:bg-white/60"
            >
              Ainda não chegou
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-full px-4 py-3 text-xs font-semibold text-muted transition-colors hover:text-acai-800 sm:ml-auto"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
