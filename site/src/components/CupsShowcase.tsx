import { motion } from 'framer-motion'
import type { CupSize } from '../catalog/types'
import { totalFreeToppings } from '../catalog/types'
import { useCatalog } from '../catalog/useCatalog'
import { formatPrice } from '../lib/order'

interface CupsShowcaseProps {
  /** Leva o tamanho escolhido direto para o montador. */
  readonly onPick: (sizeId: string) => void
}

/**
 * Vitrine dos copos: mostra o produto de verdade antes de pedir escolhas.
 *
 * Só entra tamanho com foto cadastrada. Sem foto não há vitrine, e a seção
 * some inteira em vez de mostrar um quadrado vazio.
 */
export function CupsShowcase({ onPick }: CupsShowcaseProps) {
  const { catalog } = useCatalog()

  const sizes = catalog.products
    .filter((product) => product.available)
    .flatMap((product) => product.sizes)
    .filter((size) => size.available && size.image)
  const freeToppings = totalFreeToppings(catalog.categories)

  if (sizes.length === 0) return null

  return (
    <section id="nossos-copos" className="scroll-mt-24 bg-white py-14 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-xl">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-acai-700">Nossos copos</span>
          <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
            Do lanche rápido ao pote de dividir
          </h2>
          <p className="mt-2.5 text-sm text-muted sm:mt-3 sm:text-base">
            Três tamanhos, o mesmo açaí cremoso. Todos vêm com {freeToppings} complementos grátis. Escolha
            um e monte do seu jeito.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-5">
          {sizes.map((size, index) => (
            <CupCard
              key={size.id}
              size={size}
              index={index}
              freeToppings={freeToppings}
              onPick={onPick}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

interface CupCardProps {
  readonly size: CupSize
  readonly index: number
  readonly freeToppings: number
  readonly onPick: (sizeId: string) => void
}

function CupCard({ size, index, freeToppings, onPick }: CupCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="group overflow-hidden rounded-card border border-acai-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-acai-900/10"
    >
      <div className="relative aspect-square overflow-hidden bg-acai-900">
        <img
          src={size.image}
          alt={`${size.name} da Açaiteria MR`}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {size.highlight && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-acai-900 shadow-md shadow-acai-950/20 sm:left-4 sm:top-4 sm:px-4 sm:text-sm">
            {size.highlight}
          </span>
        )}

        <span className="absolute bottom-2.5 left-2.5 rounded-full bg-acai-950/70 px-2.5 py-1 text-xs font-extrabold text-white backdrop-blur-sm sm:bottom-4 sm:left-4 sm:px-3 sm:py-1.5 sm:text-sm">
          {size.volume}
        </span>
      </div>

      <div className="p-3 sm:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-base font-extrabold tracking-tight text-ink sm:text-lg">{size.volume}</h3>
          <p className="text-base font-extrabold text-acai-800 sm:text-lg">{formatPrice(size.basePrice)}</p>
        </div>

        <p className="mt-2 inline-block rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700 sm:px-2.5 sm:py-1 sm:text-[11px]">
          {freeToppings} complementos grátis
        </p>

        <button
          type="button"
          onClick={() => onPick(size.id)}
          className="mt-3 w-full rounded-full bg-acai-800 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:animate-pulse-soft hover:bg-acai-900 sm:mt-4 sm:px-6 sm:py-3 sm:text-sm"
        >
          Montar esse
        </button>
      </div>
    </motion.article>
  )
}
