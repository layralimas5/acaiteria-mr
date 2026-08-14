import { business } from '../config/business'
import { openStatus } from '../lib/order'

export function Hero() {
  const status = openStatus(new Date())
  const { heroImage } = business

  return (
    <section
      id="topo"
      className="relative isolate flex min-h-[30rem] items-center overflow-hidden bg-acai-900 text-white sm:min-h-[34rem] lg:min-h-[40rem]"
    >
      {heroImage.src && (
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <picture>
            <source media="(min-width: 768px)" srcSet={heroImage.src} />
            <img
              src={heroImage.srcSmall}
              alt={heroImage.alt}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="size-full object-cover object-[72%_center] lg:object-right"
            />
          </picture>

          {/* Escurece o lado do texto sem apagar os copos do outro lado. */}
          <div className="absolute inset-0 bg-gradient-to-b from-acai-950 from-20% via-acai-950/80 via-55% to-acai-950/40 lg:bg-gradient-to-r lg:from-acai-950 lg:from-12% lg:via-acai-950/80 lg:via-42% lg:to-transparent lg:to-70%" />
        </div>
      )}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      <div className="relative mx-auto w-full max-w-6xl px-5 pb-16 pt-28 sm:pb-20 sm:pt-36">
        <div className="max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-acai-100 ring-1 ring-white/15 backdrop-blur-sm">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-green-400" />
              {status.label}
            </span>
            {business.deliveryOnly && (
              <span className="inline-flex items-center rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-acai-100 ring-1 ring-white/15 backdrop-blur-sm">
                Só delivery
              </span>
            )}
          </div>

          <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.03] tracking-tight drop-shadow-lg sm:text-5xl lg:text-[3.5rem]">
            Açaí de verdade,
            <span className="block text-acai-200">do jeito que você monta</span>
          </h1>

          <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-acai-100/85">
            {business.description}
          </p>
        </div>
      </div>
    </section>
  )
}
