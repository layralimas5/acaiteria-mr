import { useState } from 'react'
import { business } from '../config/business'
import type { LastOrder } from '../orders/lastOrder'
import { markReviewed } from '../orders/review'
import { saveReview } from '../orders/reviews'
import { whatsappUrl } from '../lib/order'
import { errorMessage } from '../lib/supabase'

interface ReviewInviteProps {
  readonly order: LastOrder
  /** Fecha o convite, tenha ele sido enviado ou dispensado. */
  readonly onClose: () => void
}

const MAX_RATING = 5

/** Texto que a loja recebe no WhatsApp com a avaliação. */
const reviewMessage = (
  order: LastOrder,
  rating: number,
  text: string,
  mayPublish: boolean,
): string => {
  const stars = '⭐'.repeat(rating)

  return [
    `*${business.name}: avaliação do pedido #${order.code}*`,
    '',
    `Nota: ${rating} de ${MAX_RATING} ${stars}`,
    order.customer.name ? `Cliente: ${order.customer.name}` : '',
    text.trim() ? `"${text.trim()}"` : '',
    '',
    mayPublish
      ? 'Pode publicar esse depoimento no site.'
      : 'Prefiro que não publiquem esse depoimento no site.',
  ]
    .filter((line) => line !== '')
    .join('\n')
}

/**
 * Convite de avaliação, mostrado depois que o pedido teve tempo de chegar.
 *
 * A avaliação vai para dois lugares: grava no banco e aparece na aba
 * Avaliações do painel, e sai pelo WhatsApp da loja, que é o mesmo canal do
 * pedido. A loja lê, responde e publica no site o que o cliente autorizar.
 */
export function ReviewInvite({ order, onClose }: ReviewInviteProps) {
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [mayPublish, setMayPublish] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = () => {
    if (rating === 0 || sending) return

    setSending(true)
    setError(null)

    // A aba precisa abrir agora, no clique, ou o navegador bloqueia o popup.
    const tab = window.open('', '_blank', 'noopener,noreferrer')

    void saveReview({
      orderCode: order.code,
      rating,
      text: text.trim(),
      customerName: order.customer.name,
      mayPublish,
    })
      .then(() => {
        markReviewed(order.code)

        const url = whatsappUrl(reviewMessage(order, rating, text, mayPublish))
        if (tab) {
          tab.location.href = url
        } else {
          window.location.href = url
        }

        onClose()
      })
      .catch((cause: unknown) => {
        tab?.close()
        setError(errorMessage(cause))
      })
      .finally(() => setSending(false))
  }

  const dismiss = () => {
    markReviewed(order.code)
    onClose()
  }

  return (
    <section
      id="avaliar"
      aria-label="Avaliar o pedido anterior"
      className="scroll-mt-24 bg-white pt-16 sm:pt-20"
    >
      <div className="mx-auto max-w-6xl px-5">
        <div className="rounded-card border border-acai-200 bg-white p-5 shadow-sm ring-1 ring-acai-100 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-acai-700">
                Pedido #{order.code}
              </p>
              <h2 className="mt-1.5 text-lg font-extrabold text-ink sm:text-xl">
                Como foi seu açaí?
              </h2>
              <p className="mt-1 text-sm text-muted">
                Sua nota ajuda a gente a melhorar e ajuda quem ainda não pediu a decidir.
              </p>
            </div>

            <button
              type="button"
              onClick={dismiss}
              aria-label="Fechar convite de avaliação"
              className="grid size-8 shrink-0 place-items-center rounded-full border border-acai-100 text-acai-800 transition-colors hover:bg-acai-50"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 stroke-current stroke-2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {Array.from({ length: MAX_RATING }, (_, index) => {
              const value = index + 1
              const active = value <= rating

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  aria-label={`Dar nota ${value} de ${MAX_RATING}`}
                  aria-pressed={active}
                  className="transition-transform hover:scale-110"
                >
                  <svg
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                    className={`size-9 ${active ? 'fill-amber-400' : 'fill-acai-100'}`}
                  >
                    <path d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.2l-4.94 2.6.94-5.5-4-3.9 5.53-.8z" />
                  </svg>
                </button>
              )
            })}
          </div>

          {rating > 0 && (
            <div className="mt-4">
              <label className="block">
                <span className="text-xs font-semibold text-muted">
                  Quer contar como foi? (opcional)
                </span>
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  rows={3}
                  maxLength={280}
                  placeholder="Chegou rápido, veio bem cheio, o creme de ninho estava ótimo..."
                  className="mt-1.5 w-full resize-none rounded-xl border border-acai-200 px-3 py-2.5 text-sm text-ink outline-none focus:border-acai-700"
                />
              </label>

              <label className="mt-3 flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={mayPublish}
                  onChange={(event) => setMayPublish(event.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-acai-800"
                />
                <span className="text-xs leading-relaxed text-muted">
                  Podem publicar meu depoimento no site, com meu primeiro nome.
                </span>
              </label>

              {error && (
                <p
                  role="alert"
                  className="mt-3 rounded-2xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700"
                >
                  {error}
                </p>
              )}

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={send}
                  disabled={sending}
                  className="rounded-full bg-acai-800 px-6 py-3 text-sm font-bold text-white transition-colors hover:animate-pulse-soft hover:bg-acai-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? 'Enviando...' : 'Enviar avaliação'}
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="rounded-full px-5 py-3 text-xs font-semibold text-muted transition-colors hover:text-acai-800"
                >
                  Agora não
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
