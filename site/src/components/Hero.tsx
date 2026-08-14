import { useState } from 'react'
import { business } from '../config/business'
import { products } from '../data/products'
import type { Product } from '../data/products'
import { daysToLaunch, formatPrice, hasIfood, isPreLaunch, launchLabel, openStatus } from '../lib/order'
import { OrderButton } from './OrderButton'

const featuredIds = ['copo-300', 'copo-500', 'copo-700', 'barca-1l'] as const

const featured: readonly Product[] = featuredIds
  .map((id) => products.find((product) => product.id === id))
  .filter((product): product is Product => product !== undefined)

export function Hero() {
  const [index, setIndex] = useState(0)
  const status = openStatus(new Date())
  const preLaunch = isPreLaunch()
  const countdown = daysToLaunch()
  const heroImage = business.heroImage

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
        <div
          className={`grid gap-10 pb-14 pt-28 sm:pb-16 sm:pt-36 lg:items-center lg:gap-14 ${
            heroImage.src ? 'lg:grid-cols-[1.05fr_1fr]' : ''
          }`}
        >
          <div className="order-2 min-w-0 lg:order-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-acai-100 ring-1 ring-white/15">
                <span
                  aria-hidden="true"
                  className={`size-1.5 rounded-full ${status.isOpen ? 'bg-green-400' : 'bg-acai-300'}`}
                />
                {status.label}
              </span>
              {business.deliveryOnly && (
                <span className="inline-flex items-center rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-acai-100 ring-1 ring-white/15">
                  Só delivery
                </span>
              )}
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

            {preLaunch && (
              <p className="mt-5 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm">
                <span className="font-bold text-white">Inauguramos {launchLabel()}</span>
                <span className="text-acai-100/75">
                  {countdown === 0
                    ? 'é hoje!'
                    : `faltam ${countdown} ${countdown === 1 ? 'dia' : 'dias'} — entre na lista e peça primeiro`}
                </span>
              </p>
            )}

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
                {preLaunch
                  ? `Garantir meu ${active.size}`
                  : hasIfood()
                    ? `Pedir ${active.size} no iFood`
                    : `Pedir ${active.size} agora`}
              </OrderButton>
              <a
                href="#produtos"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:animate-pulse-soft hover:border-white/50 hover:bg-white/10 sm:w-auto"
              >
                Ver cardápio completo
              </a>
            </div>
          </div>

          {heroImage.src && (
            <div className="order-1 flex min-w-0 items-center justify-center lg:order-2">
              <img
                src={heroImage.src}
                alt={heroImage.alt}
                width={1200}
                height={1200}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="h-auto w-full max-w-md rounded-[1.75rem] object-contain"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
