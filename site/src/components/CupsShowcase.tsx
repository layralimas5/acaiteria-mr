import { motion } from 'framer-motion'
import { productKinds } from '../data/builder'
import type { CupSize } from '../data/builder'
import { formatPrice } from '../lib/order'

interface CupsShowcaseProps {
  /** Leva o tamanho escolhido direto para o montador. */
  readonly onPick: (sizeId: string) => void
}

const acai = productKinds.find((product) => product.id === 'acai')

/** Vitrine dos copos: mostra o produto de verdade antes de pedir escolhas. */
export function CupsShowcase({ onPick }: CupsShowcaseProps) {
  const sizes = acai?.sizes.filter((size) => size.image) ?? []
  if (sizes.length === 0) return null

  return (
    <section id="nossos-copos" className="scroll-mt-24 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-xl">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-acai-700">Nossos copos</span>
          <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
            Do lanche rápido ao pote de dividir
          </h2>
          <p className="mt-3 text-base text-muted">
            Três tamanhos, o mesmo açaí cremoso. Todos vêm com 3 complementos grátis — escolha um e monte do
            seu jeito.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {sizes.map((size, index) => (
            <CupCard key={size.id} size={size} index={index} onPick={onPick} />
          ))}
        </div>
      </div>
    </section>
  )
}

interface CupCardProps {
  readonly size: CupSize
  readonly index: number
  readonly onPick: (sizeId: string) => void
}

function CupCard({ size, index, onPick }: CupCardProps) {
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
          <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-acai-900">
            {size.highlight}
          </span>
        )}

        <span className="absolute bottom-4 left-4 rounded-full bg-acai-950/70 px-3 py-1.5 text-sm font-extrabold text-white backdrop-blur-sm">
          {size.volume}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-lg font-extrabold tracking-tight text-ink">{size.volume}</h3>
          <p className="text-lg font-extrabold text-acai-800">{formatPrice(size.basePrice)}</p>
        </div>

        <p className="mt-2 inline-block rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">
          {size.freeToppings} complementos grátis
        </p>

        <button
          type="button"
          onClick={() => onPick(size.id)}
          className="mt-4 w-full rounded-full bg-acai-800 px-6 py-3 text-sm font-bold text-white transition-colors hover:animate-pulse-soft hover:bg-acai-900"
        >
          Montar esse
        </button>
      </div>
    </motion.article>
  )
}
