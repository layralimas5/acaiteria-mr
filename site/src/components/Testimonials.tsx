import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { Review } from '../orders/reviews'
import { listPublishedReviews } from '../orders/reviews'

const MAX_RATING = 5

function Stars({ rating }: { readonly rating: number }) {
  const rounded = Math.round(rating)

  return (
    <span
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`${rounded} de ${MAX_RATING} estrelas`}
    >
      {Array.from({ length: MAX_RATING }, (_, index) => (
        <svg
          key={index}
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={`size-4 ${index < rounded ? 'fill-amber-400' : 'fill-acai-100'}`}
        >
          <path d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.2l-4.94 2.6.94-5.5-4-3.9 5.53-.8z" />
        </svg>
      ))}
    </span>
  )
}

/**
 * Prova social: o que os clientes falam depois de receber.
 *
 * Só aparece aqui a avaliação que o cliente autorizou e que a loja publicou no
 * painel. Enquanto não houver nenhuma, a seção some inteira: melhor não ter
 * depoimento do que ter depoimento inventado.
 */
export function Testimonials() {
  const [reviews, setReviews] = useState<readonly Review[]>([])

  useEffect(() => {
    void listPublishedReviews()
      .then(setReviews)
      .catch(() => setReviews([]))
  }, [])

  if (reviews.length === 0) return null

  const average = reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length

  return (
    <section id="depoimentos" className="scroll-mt-24 bg-white py-14 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-xl">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-acai-700">Depoimentos</span>
          <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
            Quem pediu, voltou a pedir
          </h2>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Stars rating={average} />
            <span className="text-sm font-bold text-ink">
              {average.toFixed(1).replace('.', ',')} de {MAX_RATING}
            </span>
            <span className="text-sm text-muted">
              · {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}
            </span>
          </div>
        </div>

        <div className="mt-7 grid gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {reviews.map((review, index) => (
            <TestimonialCard key={review.id} review={review} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

interface TestimonialCardProps {
  readonly review: Review
  readonly index: number
}

/** Só o primeiro nome vai para o site: foi o que o cliente autorizou. */
const firstName = (name: string): string => name.trim().split(' ')[0] ?? 'Cliente'

function TestimonialCard({ review, index }: TestimonialCardProps) {
  const name = firstName(review.customerName)
  const initial = name.charAt(0).toUpperCase()

  return (
    <motion.figure
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="flex h-full flex-col rounded-card border border-acai-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-acai-900/10 sm:p-6"
    >
      <Stars rating={review.rating} />

      <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink sm:text-base">
        “{review.text}”
      </blockquote>

      <figcaption className="mt-4 flex items-center gap-3 border-t border-acai-100 pt-4">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-acai-100 text-sm font-extrabold text-acai-800"
        >
          {initial}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-ink">{name}</span>
          {review.district && (
            <span className="block truncate text-xs text-muted">{review.district}</span>
          )}
        </span>
      </figcaption>
    </motion.figure>
  )
}
