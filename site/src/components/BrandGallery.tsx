import { AnimatePresence, motion } from 'framer-motion'
import { business } from '../config/business'
import { useRotation } from '../hooks/useRotation'

/**
 * Artes da marca em rodízio, de ponta a ponta da tela. O texto da seção vive
 * dentro do próprio banner, numa faixa escura no rodapé: assim ele lê bem sobre
 * qualquer ilustração e não cobre os personagens nem a logo já desenhados.
 */
export function BrandGallery() {
  const artworks = business.gallery
  const { index: current, goTo, paused } = useRotation(artworks.length, business.heroRotationMs)

  if (artworks.length === 0) return null

  const artwork = artworks[current]

  return (
    <section id="a-marca" className="relative scroll-mt-24 bg-acai-900">
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

        {/* Faixa que garante leitura do texto sobre qualquer arte. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-acai-950 via-acai-950/75 via-38% to-transparent"
        />

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-6xl px-5 pb-8 sm:pb-12 lg:pb-16">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
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
                    <h2 className="mt-2 text-balance text-2xl font-extrabold leading-tight tracking-tight drop-shadow-lg sm:text-4xl lg:text-5xl">
                      {artwork.headline}
                    </h2>
                  )}

                  {artwork?.subline && (
                    <p className="mt-3 text-pretty text-sm leading-relaxed text-acai-100/90 sm:text-base">
                      {artwork.subline}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>

              <a
                href="#monte-seu-acai"
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-acai-900 shadow-lg shadow-acai-950/30 transition-colors hover:animate-pulse-soft hover:bg-acai-50 sm:px-8 sm:py-3.5"
              >
                Montar meu pedido
              </a>
            </div>
          </div>
        </div>

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
    </section>
  )
}
