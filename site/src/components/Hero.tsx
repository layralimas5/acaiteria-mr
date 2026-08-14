import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { business } from '../config/business'
import { products } from '../data/products'
import type { Product } from '../data/products'
import { formatPrice, hasIfood } from '../lib/order'
import { AcaiCup } from './AcaiCup'
import { OrderButton } from './OrderButton'

const featuredIds = ['copo-500', 'pote-500', 'barca-1l'] as const

const featured: readonly Product[] = featuredIds
  .map((id) => products.find((product) => product.id === id))
  .filter((product): product is Product => product !== undefined)

export function Hero() {
  const [index, setIndex] = useState(0)
  const total = featured.length

  const go = useCallback(
    (step: number) => setIndex((current) => (current + step + total) % total),
    [total],
  )

  const active = featured[index]

  if (!active) return null

  return (
    <section id="topo" className="relative overflow-hidden bg-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,var(--color-acai-100)_0%,transparent_70%)]"
      />

      <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-10 sm:pt-14">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-acai-100 bg-acai-50 px-4 py-1.5 text-xs font-semibold text-acai-700">
            <span className="size-1.5 rounded-full bg-acai-500" aria-hidden="true" />
            Entrega em até {business.delivery.averageMinutes} min
          </span>

          <h1 className="mt-5 max-w-3xl text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Açaí de verdade, <span className="text-acai-700">do jeito que você monta</span>
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted sm:text-lg">
            {business.description}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <OrderButton className="w-full sm:w-auto" />
            <a
              href="#produtos"
              className="inline-flex w-full items-center justify-center rounded-full border border-acai-200 px-6 py-3 text-sm font-semibold text-acai-700 transition-colors hover:border-acai-400 hover:bg-acai-50 sm:w-auto"
            >
              Ver cardápio
            </a>
          </div>
        </div>

        <div className="relative mt-14 sm:mt-16">
          <div className="rounded-[2.5rem] border border-acai-100 bg-gradient-to-b from-acai-50 to-white px-4 py-10 sm:px-10 sm:py-12">
            <div className="flex items-center justify-center gap-4 sm:gap-10">
              <CarouselArrow direction="prev" onClick={() => go(-1)} />

              <div className="flex min-h-[300px] w-full max-w-md items-center justify-center sm:min-h-[340px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={active.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                    className="flex flex-col items-center"
                  >
                    <AcaiCup label={active.size} className="h-56 w-auto sm:h-64" />
                    <p aria-live="polite" className="mt-6 text-center">
                      <span className="block text-lg font-bold text-ink sm:text-xl">{active.name}</span>
                      <span className="mt-1 block text-sm text-muted">{active.description}</span>
                      <span className="mt-3 block text-2xl font-extrabold text-acai-700">
                        {formatPrice(active.price)}
                      </span>
                    </p>
                    <OrderButton product={active} className="mt-5" />
                  </motion.div>
                </AnimatePresence>
              </div>

              <CarouselArrow direction="next" onClick={() => go(1)} />
            </div>

            <div className="mt-8 flex items-center justify-center gap-2">
              {featured.map((product, position) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setIndex(position)}
                  aria-label={`Ver ${product.name}`}
                  aria-current={position === index}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    position === index ? 'w-8 bg-acai-700' : 'w-2 bg-acai-200 hover:bg-acai-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { title: 'Batido na hora', text: 'Nada de açaí parado. Cada pedido sai fresco do balcão.' },
            { title: 'Complemento generoso', text: 'Sem contar grama. Você monta e a gente capricha.' },
            {
              title: hasIfood() ? 'Pedido pelo iFood' : 'Pedido pelo WhatsApp',
              text: `Entrega média de ${business.delivery.averageMinutes} minutos na região.`,
            },
          ].map((item) => (
            <li key={item.title} className="rounded-2xl border border-acai-100 bg-white p-5">
              <h2 className="text-sm font-bold text-ink">{item.title}</h2>
              <p className="mt-1 text-sm text-muted">{item.text}</p>
            </li>
          ))}
        </ul>
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
      aria-label={isPrev ? 'Produto anterior' : 'Próximo produto'}
      className="grid size-11 shrink-0 place-items-center rounded-full border border-acai-200 bg-white text-acai-700 shadow-sm transition-colors hover:border-acai-400 hover:bg-acai-50 sm:size-12"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current stroke-2">
        <path d={isPrev ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
