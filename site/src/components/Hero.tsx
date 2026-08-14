import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { business } from '../config/business'
import { products } from '../data/products'
import type { Product } from '../data/products'
import { formatPrice, hasIfood, openStatus } from '../lib/order'
import { AcaiCup } from './AcaiCup'
import { OrderButton } from './OrderButton'

const featuredIds = ['copo-300', 'copo-500', 'copo-700', 'barca-1l'] as const

const featured: readonly Product[] = featuredIds
  .map((id) => products.find((product) => product.id === id))
  .filter((product): product is Product => product !== undefined)

export function Hero() {
  const [index, setIndex] = useState(1)
  const total = featured.length
  const status = openStatus(new Date())

  const go = useCallback((step: number) => setIndex((current) => (current + step + total) % total), [total])

  const active = featured[index]

  if (!active) return null

  return (
    <section id="topo" className="relative isolate overflow-hidden bg-acai-900 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-40 size-[520px] rounded-full bg-acai-600/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -right-20 size-[560px] rounded-full bg-acai-500/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      <div className="relative mx-auto max-w-6xl px-5">
        <div className="grid gap-10 pb-14 pt-28 sm:pb-16 sm:pt-36 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14">
            <div className="order-2 lg:order-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-acai-100 ring-1 ring-white/15">
                  <span
                    aria-hidden="true"
                    className={`size-1.5 rounded-full ${status.isOpen ? 'bg-green-400' : 'bg-acai-300'}`}
                  />
                  {status.label}
                </span>
                {business.delivery.freeShippingFrom !== null && (
                  <span className="inline-flex items-center rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-acai-100 ring-1 ring-white/15">
                    Frete grátis acima de {formatPrice(business.delivery.freeShippingFrom)}
                  </span>
                )}
              </div>

              <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.03] tracking-tight sm:text-5xl lg:text-[3.5rem]">
                Açaí de verdade,
                <span className="block text-acai-200">do jeito que você monta</span>
              </h1>

              <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-acai-100/80">
                {business.description}
              </p>

              <fieldset className="mt-8">
                <legend className="text-xs font-bold uppercase tracking-[0.18em] text-acai-200">
                  Escolha o tamanho
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {featured.map((product, position) => {
                    const isActive = position === index
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => setIndex(position)}
                        aria-pressed={isActive}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                          isActive
                            ? 'bg-white text-acai-900'
                            : 'bg-white/10 text-acai-100 ring-1 ring-white/15 hover:bg-white/20'
                        }`}
                      >
                        {product.size}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <div aria-live="polite" className="mt-7 flex items-end gap-4">
                <span className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                  {formatPrice(active.price)}
                </span>
                <span className="pb-1.5 text-sm text-acai-100/75">
                  {active.name}
                  {active.toppingsIncluded > 0 && ` · ${active.toppingsIncluded} complementos`}
                </span>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <OrderButton product={active} variant="light" className="w-full sm:w-auto">
                  {hasIfood() ? `Pedir ${active.size} no iFood` : `Pedir ${active.size} agora`}
                </OrderButton>
                <a
                  href="#produtos"
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/10 sm:w-auto"
                >
                  Ver cardápio completo
                </a>
              </div>

            </div>

            <div className="order-1 flex items-center justify-center gap-2 sm:gap-4 lg:order-2">
              <CarouselArrow direction="prev" onClick={() => go(-1)} />

              <div className="relative flex min-h-[290px] w-full max-w-xs items-center justify-center sm:min-h-[360px]">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-6 bottom-6 top-10 rounded-[2rem] bg-white/5 ring-1 ring-white/10"
                />
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={active.id}
                    initial={{ opacity: 0, scale: 0.92, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -12 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="relative flex flex-col items-center"
                  >
                    {active.highlight && (
                      <span className="mb-3 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-acai-900">
                        {active.highlight}
                      </span>
                    )}
                    <AcaiCup label={active.size} className="h-56 w-auto drop-shadow-2xl sm:h-72" />
                  </motion.div>
                </AnimatePresence>
              </div>

              <CarouselArrow direction="next" onClick={() => go(1)} />
            </div>
          </div>

        <div className="flex items-center justify-center gap-2 pb-10 lg:hidden">
          {featured.map((product, position) => (
            <button
              key={product.id}
              type="button"
              onClick={() => setIndex(position)}
              aria-label={`Ver ${product.name}`}
              aria-current={position === index}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                position === index ? 'w-7 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

interface CarouselArrowProps {
  readonly direction: 'prev' | 'next'
  readonly onClick: () => void
}

function CarouselArrow({ direction, onClick }: CarouselArrowProps) {
  const isPrev = direction === 'prev'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isPrev ? 'Tamanho anterior' : 'Próximo tamanho'}
      className="grid size-10 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:border-white/40 hover:bg-white/20 sm:size-11"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current stroke-2">
        <path d={isPrev ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
