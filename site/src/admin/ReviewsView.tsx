import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from '../lib/supabase'
import type { Review } from '../orders/reviews'
import {
  averageRating,
  listReviews,
  removeReview,
  setReviewDistrict,
  setReviewPublished,
} from '../orders/reviews'

const MAX_RATING = 5

function Stars({ rating }: { readonly rating: number }) {
  return (
    <span className="flex items-center gap-0.5" role="img" aria-label={`${rating} de ${MAX_RATING}`}>
      {Array.from({ length: MAX_RATING }, (_, index) => (
        <svg
          key={index}
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={`size-4 ${index < rating ? 'fill-amber-400' : 'fill-acai-100'}`}
        >
          <path d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.2l-4.94 2.6.94-5.5-4-3.9 5.53-.8z" />
        </svg>
      ))}
    </span>
  )
}

/**
 * O que os clientes responderam depois de receber o pedido.
 *
 * Publicar é um clique: o depoimento marcado aparece na hora na seção do site,
 * sem publicar nada nem mexer em código. Só entra aqui quem autorizou.
 */
export function ReviewsView() {
  const [reviews, setReviews] = useState<readonly Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    void listReviews()
      .then((list) => {
        setReviews(list)
        setError(null)
      })
      .catch((cause: unknown) => setError(errorMessage(cause)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(refresh, [refresh])

  const run = (action: () => Promise<void>) => {
    void action()
      .then(refresh)
      .catch((cause: unknown) => setError(errorMessage(cause)))
  }

  const average = averageRating(reviews)
  const publishedCount = reviews.filter((review) => review.published).length

  return (
    <>
      <h1 className="text-xl font-extrabold text-ink">Avaliações</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        O que os clientes responderam depois de receber. Marcar "publicar" põe o depoimento no site
        na hora.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
          {error}
        </p>
      )}

      {average !== null && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-card border border-acai-100 bg-white p-5 shadow-sm">
          <span className="text-3xl font-extrabold tracking-tight text-acai-800">
            {average.toFixed(1).replace('.', ',')}
          </span>
          <Stars rating={Math.round(average)} />
          <span className="text-sm text-muted">
            {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'} · {publishedCount}{' '}
            no site
          </span>
        </div>
      )}

      {loading ? (
        <p className="mt-5 text-sm text-muted">Carregando avaliações...</p>
      ) : reviews.length === 0 ? (
        <p className="mt-5 rounded-card border border-dashed border-acai-200 p-8 text-center text-sm text-muted">
          Nenhuma avaliação ainda. Elas chegam quando o cliente abre o link que sai na mensagem de
          pedido entregue.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} run={run} />
          ))}
        </ul>
      )}
    </>
  )
}

function ReviewCard({
  review,
  run,
}: {
  readonly review: Review
  readonly run: (action: () => Promise<void>) => void
}) {
  const [district, setDistrict] = useState(review.district)

  return (
    <li className="rounded-card border border-acai-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Stars rating={review.rating} />
          <p className="mt-2 text-sm font-bold text-ink">
            {review.customerName || 'Cliente'}
            {review.orderCode && (
              <span className="ml-2 font-semibold text-muted">pedido #{review.orderCode}</span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {new Date(review.createdAt).toLocaleString('pt-BR')}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
            review.mayPublish ? 'bg-green-50 text-green-700' : 'bg-acai-50 text-muted'
          }`}
        >
          {review.mayPublish ? 'Cliente autorizou' : 'Sem autorização'}
        </span>
      </div>

      {review.text && (
        <blockquote className="mt-3 rounded-2xl bg-acai-50 px-4 py-3 text-sm leading-relaxed text-ink">
          {review.text}
        </blockquote>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-acai-100 pt-4">
        {review.mayPublish && review.text ? (
          <>
            <label className="min-w-0 flex-1">
              <span className="text-xs font-bold text-acai-700">Bairro no depoimento</span>
              <input
                type="text"
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
                onBlur={() => {
                  if (district.trim() !== review.district) {
                    run(() => setReviewDistrict(review.id, district))
                  }
                }}
                placeholder="Campo Grande"
                className="mt-1 w-full rounded-xl border border-acai-200 px-3 py-2 text-sm text-ink outline-none focus:border-acai-700"
              />
            </label>

            <button
              type="button"
              onClick={() => run(() => setReviewPublished(review.id, !review.published))}
              className={`rounded-full px-5 py-2.5 text-xs font-bold transition-colors ${
                review.published
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'border border-acai-200 text-acai-800 hover:bg-acai-50'
              }`}
            >
              {review.published ? 'No site' : 'Publicar no site'}
            </button>
          </>
        ) : (
          <p className="flex-1 text-xs text-muted">
            {review.mayPublish
              ? 'Sem texto para publicar: só a nota entrou.'
              : 'O cliente não autorizou a publicação, então esse depoimento não pode ir para o site.'}
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            if (window.confirm('Apagar essa avaliação?')) run(() => removeReview(review.id))
          }}
          className="rounded-full px-4 py-2.5 text-xs font-semibold text-muted transition-colors hover:text-acai-800"
        >
          Apagar
        </button>
      </div>
    </li>
  )
}
