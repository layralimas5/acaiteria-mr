import { AnimatePresence, motion } from 'framer-motion'
import { business } from '../config/business'
import { useRotation } from '../hooks/useRotation'
import { openStatus } from '../lib/order'

export function Hero() {
  const status = openStatus(new Date())
  const images = business.heroImages
  const { index: current, goTo, paused } = useRotation(images.length, business.heroRotationMs)

  return (
    <section
      id="topo"
      className="relative isolate flex min-h-[40rem] items-end overflow-hidden bg-acai-900 text-white sm:min-h-[38rem] sm:items-center lg:min-h-[40rem]"
    >
      {images.length > 0 && (
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <AnimatePresence initial={false}>
            <motion.div
              key={current}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: paused ? 0 : 0.9, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <picture>
                <source media="(min-width: 768px)" srcSet={images[current]?.src} />
                <img
                  src={images[current]?.srcSmall}
                  alt={images[current]?.alt}
                  loading={current === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={current === 0 ? 'high' : 'low'}
                  className="size-full object-cover object-[88%_center] sm:object-[92%_center] lg:object-right"
                />
              </picture>
            </motion.div>
          </AnimatePresence>

          {/*
            No celular o escuro sobe do rodapé: o texto fica embaixo, com leitura
            garantida, e a arte aparece limpa na parte de cima. Do tablet para
            cima ele desce do topo, e no desktop vira horizontal, escuro à
            esquerda e limpo do lado dos copos.
          */}
          <div className="absolute inset-0 bg-gradient-to-t from-acai-950 from-6% via-acai-950/85 via-44% to-transparent to-80% sm:bg-gradient-to-b sm:from-acai-950 sm:from-2% sm:via-acai-950/82 sm:via-58% sm:to-acai-950/25 sm:to-100% lg:bg-gradient-to-r lg:from-acai-950 lg:from-12% lg:via-acai-950/78 lg:via-42% lg:to-transparent lg:to-68%" />

          {/*
            Só no celular: uma sombra curta no topo, para o menu branco ler
            sobre a parte clara da arte.
          */}
          <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-acai-950/75 to-transparent sm:hidden" />
        </div>
      )}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      {/*
        No celular o bloco encosta no rodapé: sem respiro em cima, ele desce de
        verdade em vez de ficar no meio. Quem garante a folga do menu fixo é a
        altura mínima da seção, que sobra bastante. Do tablet para cima o texto
        volta a ser centralizado e o respiro do topo volta com ele.
      */}
      <div className="relative mx-auto w-full max-w-6xl px-5 pb-14 pt-0 sm:pb-20 sm:pt-36">
        <div className="max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-acai-100 ring-1 ring-white/15 backdrop-blur-sm sm:gap-2 sm:px-3.5 sm:py-1.5 sm:text-xs">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-green-400" />
              {status.label}
            </span>
            {business.deliveryOnly && (
              <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[11px] font-bold text-acai-900 shadow-sm sm:px-3.5 sm:py-1.5 sm:text-xs">
                Só delivery
              </span>
            )}
          </div>

          <h1 className="mt-4 text-balance text-[1.75rem] font-extrabold leading-[1.1] tracking-tight drop-shadow-lg sm:mt-6 sm:text-5xl sm:leading-[1.03] lg:text-[3.5rem]">
            Açaí de verdade,
            <span className="block text-acai-200">do jeito que você monta</span>
          </h1>

          <p className="mt-3 max-w-md text-pretty text-[13px] leading-relaxed text-acai-100/85 sm:mt-5 sm:text-base">
            {business.description}
          </p>

          {images.length > 1 && (
            <div className="mt-5 flex items-center gap-2 sm:mt-7">
              {images.map((image, index) => (
                <button
                  key={image.src}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Ver arte ${index + 1} de ${images.length}`}
                  aria-current={index === current}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === current ? 'w-7 bg-white' : 'w-3 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
