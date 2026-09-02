import { motion } from 'framer-motion'
import type { CupSize } from '../catalog/types'
import { totalFreeToppings } from '../catalog/types'
import { useSellableCatalog } from '../catalog/sellable'
import { formatPrice } from '../lib/order'

interface CupsShowcaseProps {
  /** Leva o tamanho escolhido direto para o montador. */
  readonly onPick: (sizeId: string) => void
}

/**
 * Índice do card que ocupa a linha inteira no celular.
 *
 * A vitrine roda num grid de duas colunas na tela pequena. Com um número ímpar
 * de tamanhos sobra sempre um card sozinho, e ao lado dele fica meia tela de
 * branco. Esticar um deles para a linha toda fecha o buraco e ainda dá o
 * destaque para o tamanho que a loja marcou como mais pedido.
 *
 * Com número par não sobra ninguém, então nada é esticado: o grid fecha certo
 * sozinho e um card gigante ali seria só desperdício de rolagem.
 */
const wideIndex = (sizes: readonly CupSize[]): number => {
  if (sizes.length % 2 === 0) return -1
  const highlighted = sizes.findIndex((size) => size.highlight)
  return highlighted >= 0 ? highlighted : 0
}

/**
 * Vitrine dos copos: mostra o produto de verdade antes de pedir escolhas.
 *
 * Só entra tamanho com foto cadastrada. Sem foto não há vitrine, e a seção
 * some inteira em vez de mostrar um quadrado vazio.
 */
export function CupsShowcase({ onPick }: CupsShowcaseProps) {
  const { catalog } = useSellableCatalog()

  const sizes = catalog.products.flatMap((product) => product.sizes).filter((size) => size.image)
  const freeToppings = totalFreeToppings(catalog.categories)

  if (sizes.length === 0) return null

  const wide = wideIndex(sizes)

  return (
    <section id="nossos-copos" className="scroll-mt-20 bg-white py-11 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-xl">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-acai-700">Nossos copos</span>
          <h2 className="mt-1.5 text-[clamp(1.5rem,6vw,2.25rem)] font-extrabold tracking-tight text-ink max-sm:leading-[1.12] sm:mt-2 sm:text-4xl sm:leading-tight">
            Do lanche rápido ao pote de dividir
          </h2>
          <p className="mt-2 text-[clamp(0.875rem,3.6vw,1rem)] leading-[1.5] text-muted sm:mt-3 sm:leading-normal">
            Três tamanhos, o mesmo açaí cremoso. Todos vêm com {freeToppings} complementos grátis. Escolha
            um e monte do seu jeito.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-10 sm:grid-cols-3 sm:gap-5">
          {sizes.map((size, index) => (
            <CupCard
              key={size.id}
              size={size}
              index={index}
              wide={index === wide}
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
  /** Ocupa a linha inteira no celular, para o grid ímpar não deixar buraco. */
  readonly wide: boolean
  readonly freeToppings: number
  readonly onPick: (sizeId: string) => void
}

function CupCard({ size, index, wide, freeToppings, onPick }: CupCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className={`group overflow-hidden rounded-card border border-acai-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-acai-900/10 ${
        wide ? 'max-sm:col-span-2' : ''
      }`}
    >
      {/* Esticado na linha toda, o quadrado viraria uma foto altíssima, então o
          recorte fica mais largo. Mas ele sobe: o que vende o copo é a
          cobertura, e um corte centralizado decepa justamente a fruta de cima.
          As fotos são retratos de produto, o pé do copo pode sair. */}
      <div
        className={`relative overflow-hidden bg-acai-900 ${
          wide ? 'aspect-[4/3] sm:aspect-square' : 'aspect-square'
        }`}
      >
        <img
          src={size.image}
          alt={`${size.name} da Açaiteria MR`}
          loading="lazy"
          decoding="async"
          className={`size-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            wide ? 'object-[center_30%] sm:object-center' : 'object-center'
          }`}
        />

        {size.highlight && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-acai-900 shadow-md shadow-acai-950/20 sm:left-4 sm:top-4 sm:px-4 sm:py-1.5 sm:text-sm">
            {size.highlight}
          </span>
        )}

        {/* O volume aparece logo abaixo, no título do card. No celular a
            etiqueta sobre a foto só repetiria a mesma palavra. */}
        <span className="absolute bottom-4 left-4 hidden rounded-full bg-acai-950/70 px-3 py-1.5 text-sm font-extrabold text-white backdrop-blur-sm sm:block">
          {size.volume}
        </span>
      </div>

      <div className="p-2.5 sm:p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[0.9375rem] font-extrabold tracking-tight text-ink sm:text-lg">
            {size.volume}
          </h3>
          <p className="text-[0.9375rem] font-extrabold text-acai-800 sm:text-lg">
            {formatPrice(size.basePrice)}
          </p>
        </div>

        <p className="mt-1.5 inline-block rounded-full bg-green-50 px-2 py-0.5 text-[12px] font-bold text-green-700 sm:mt-2 sm:px-2.5 sm:py-1 sm:text-[11px]">
          {freeToppings} complementos grátis
        </p>

        <button
          type="button"
          onClick={() => onPick(size.id)}
          className="mt-2.5 w-full rounded-full bg-acai-800 px-4 py-2.5 text-[0.8125rem] font-bold text-white transition-colors hover:animate-pulse-soft hover:bg-acai-900 sm:mt-4 sm:px-6 sm:py-3 sm:text-sm"
        >
          Montar esse
        </button>
      </div>
    </motion.article>
  )
}
