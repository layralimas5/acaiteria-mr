import { business } from '../config/business'

const items: readonly string[] = [
  'Batido na hora',
  'Complemento à vontade de escolha',
  `Entrega em ~${business.delivery.averageMinutes} min`,
]

/**
 * Faixa em looping infinito para a esquerda.
 * O conteúdo é duplicado e a animação anda exatamente metade da largura,
 * então a emenda entre as cópias nunca aparece.
 */
export function Marquee() {
  return (
    <div className="relative isolate overflow-hidden border-y border-white/10 bg-acai-950 py-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-acai-950 to-transparent sm:w-28"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-acai-950 to-transparent sm:w-28"
      />

      <div className="flex w-max animate-marquee items-center">
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy === 1} className="flex items-center">
            {items.map((item) => (
              <li
                key={`${copy}-${item}`}
                className="flex shrink-0 items-center gap-4 whitespace-nowrap px-6 text-sm font-semibold uppercase tracking-[0.14em] text-acai-100 sm:gap-6 sm:px-8 sm:text-base"
              >
                <span
                  aria-hidden="true"
                  className="size-1.5 shrink-0 rotate-45 rounded-[2px] bg-acai-400"
                />
                {item}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}
