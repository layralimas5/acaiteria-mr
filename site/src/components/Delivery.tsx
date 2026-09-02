import { business } from '../config/business'
import { formatPrice, hasIfood, whatsappUrl } from '../lib/order'

const steps = [
  { title: 'Escolha o tamanho', text: 'Copo, pote ou barca. Do individual ao litro pra dividir.' },
  { title: 'Monte os complementos', text: 'Frutas, crocantes e caldas na quantidade que o tamanho permite.' },
  { title: 'Receba em casa', text: 'A gente embala pra não derreter no caminho.' },
] as const

export function Delivery() {
  const { freeShippingFrom, minMinutes } = business.delivery

  /*
    No desktop a seção é uma coluna de texto com os botões embaixo, ao lado da
    lista de passos. No celular tudo vira uma pilha, e a ordem do desktop
    colocaria o botão antes de explicar como funciona: pedir a ação antes de
    dar o motivo.

    O `contents` do celular dissolve a coluna da esquerda, então texto, passos e
    botões viram irmãos na mesma pilha e o `order` reorganiza os três. A partir
    de `lg` o wrapper volta a ser a coluna da esquerda e o layout do desktop
    fica exatamente como era.
  */
  return (
    <section id="entrega" className="scroll-mt-20 bg-acai-900 text-white">
      <div className="mx-auto max-w-6xl px-5 py-11 sm:py-20">
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-10">
          <div className="max-lg:contents">
            <div className="max-lg:order-1">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-acai-200">
                {business.deliveryOnly ? 'Só delivery' : 'Entrega'}
              </span>
              <h2 className="mt-1.5 text-[clamp(1.5rem,6vw,2.25rem)] font-extrabold leading-[1.12] tracking-tight sm:mt-2 sm:text-4xl">
                Pediu, chega a partir de {minMinutes} minutos
              </h2>
              <p className="mt-2.5 max-w-md text-[clamp(0.9375rem,3.7vw,1rem)] leading-[1.5] text-acai-100 sm:mt-4 sm:leading-relaxed">
                {hasIfood()
                  ? 'Peça pelo iFood e acompanhe a entrega em tempo real pelo app. Prefere falar com a gente? O WhatsApp também tá aberto.'
                  : 'Monte seu pedido aqui no site: você escolhe, a gente confirma pelo WhatsApp e sai pra entrega.'}
              </p>

              {freeShippingFrom !== null && (
                <p className="mt-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold sm:mt-5">
                  Entrega grátis acima de {formatPrice(freeShippingFrom)}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2.5 max-lg:order-3 sm:flex-row lg:mt-8 lg:gap-3">
              {hasIfood() && (
                <a
                  href={business.delivery.ifoodUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-bold text-acai-900 transition-colors hover:animate-pulse-soft hover:bg-acai-50"
                >
                  Pedir no iFood
                </a>
              )}
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:animate-pulse-soft hover:bg-white/10"
              >
                Falar no WhatsApp
              </a>
            </div>
          </div>

          <ol className="flex flex-col gap-2.5 max-lg:order-2 sm:gap-4">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="flex gap-3 rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10 transition-colors hover:animate-pulse-soft hover:bg-white/10 hover:ring-white/25 sm:gap-4 sm:p-5"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-[0.8125rem] font-extrabold text-acai-900 sm:size-9 sm:text-sm">
                  {index + 1}
                </span>
                <span>
                  <span className="block text-sm font-bold leading-snug">{step.title}</span>
                  <span className="mt-0.5 block text-sm leading-[1.45] text-acai-100 sm:mt-1 sm:leading-normal">
                    {step.text}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
