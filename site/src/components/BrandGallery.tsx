import { AnimatePresence, motion } from 'framer-motion'
import { business } from '../config/business'
import { useRotation } from '../hooks/useRotation'

/**
 * Artes da marca em rodízio, de ponta a ponta da tela.
 *
 * No celular a arte fica inteira, sem nada por cima, e o texto desce para uma
 * faixa escura logo abaixo: numa tela estreita, sobrepor cobriria justamente
 * os personagens e a logo que a ilustração já desenha. Do tablet para cima
 * sobra largura, então o texto volta para dentro do banner, no rodapé.
 */
export function BrandGallery() {
  const artworks = business.gallery
  const { index: current, goTo, paused } = useRotation(artworks.length, business.heroRotationMs)

  if (artworks.length === 0) return null

  const artwork = artworks[current]

  return (
    <section id="a-marca" className="relative scroll-mt-24 bg-acai-950">
      <div className="relative aspect-[4/3] max-h-[85vh] sm:aspect-[16/9] sm:max-h-[78vh]">
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
              <source media="(min-width: 768px)" srcSet={artwork?.src} />
              <img
                src={artwork?.srcSmall}
                alt={artwork?.alt}
                loading="lazy"
                decoding="async"
                className="size-full object-cover"
              />
            </picture>
          </motion.div>
        </AnimatePresence>

        {/*
          Faixa que garante leitura do texto sobre a arte. Só existe onde o
          texto fica por cima, ou seja, do tablet para cima. No celular ela
          vira um degradê curto, só para a arte encostar no bloco escuro sem
          corte seco.
        */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-acai-950 to-transparent sm:h-3/4 sm:via-acai-950/75 sm:via-38%"
        />

        {artworks.length > 1 && (
          <div className="absolute right-5 top-5 flex gap-2 sm:right-8 sm:top-8">
            {artworks.map((item, index) => (
              <button
                key={item.src}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Ver arte ${index + 1} de ${artworks.length}`}
                aria-current={index === current}
                className={`h-1.5 rounded-full shadow-sm transition-all duration-300 ${
                  index === current ? 'w-8 bg-white' : 'w-3 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* No celular corre no fluxo, abaixo da arte. Do tablet para cima volta
          para dentro do banner, ancorado no rodapé. */}
      <div className="relative sm:absolute sm:inset-x-0 sm:bottom-0">
        <div className="mx-auto max-w-6xl px-5 pb-10 pt-6 sm:pb-12 sm:pt-0 lg:pb-16">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: paused ? 0 : 0.35, ease: 'easeOut' }}
                className="max-w-2xl text-white"
              >
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-acai-200">
                  A marca
                </span>

                {artwork?.headline && (
                  <h2 className="mt-2 text-balance text-[1.75rem] font-extrabold leading-[1.15] tracking-tight sm:text-4xl sm:drop-shadow-lg lg:text-5xl">
                    {artwork.headline}
                  </h2>
                )}

                {artwork?.subline && (
                  <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-acai-100/85 sm:max-w-none sm:text-base sm:text-acai-100/90">
                    {artwork.subline}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>

            <a
              href="#monte-seu-acai"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-bold text-acai-900 shadow-lg shadow-acai-950/30 transition-colors hover:animate-pulse-soft hover:bg-acai-50 sm:px-8"
            >
              Montar meu pedido
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
