import { business } from '../config/business'
import { formatPrice, hasIfood, isPreLaunch, launchLabel, whatsappUrl } from '../lib/order'

const steps = [
  { title: 'Escolha o tamanho', text: 'Copo, pote ou barca. Do individual ao litro pra dividir.' },
  { title: 'Monte os complementos', text: 'Frutas, crocantes e caldas na quantidade que o tamanho permite.' },
  { title: 'Receba em casa', text: 'A gente embala pra não derreter no caminho.' },
] as const

export function Delivery() {
  const { freeShippingFrom, averageMinutes } = business.delivery
  const preLaunch = isPreLaunch()

  return (
    <section id="entrega" className="scroll-mt-24 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="overflow-hidden rounded-[2rem] bg-acai-900 text-white">
          <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-acai-200">
                {business.deliveryOnly ? 'Só delivery' : 'Entrega'}
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {preLaunch ? `A partir de ${launchLabel()}, direto na sua casa` : `Pediu, chegou em ${averageMinutes} minutos`}
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-acai-100">
                {preLaunch
                  ? `A Açaiteria MR abre dia ${launchLabel()} e vai operar só por delivery, sem loja de balcão. Entra na lista pelo WhatsApp que a gente te avisa assim que os pedidos abrirem.`
                  : hasIfood()
                    ? 'Peça pelo iFood e acompanhe a entrega em tempo real pelo app. Prefere falar com a gente? O WhatsApp também tá aberto.'
                    : 'O pedido sai pelo WhatsApp: você escolhe, a gente confirma e sai pra entrega.'}
              </p>

              {freeShippingFrom !== null && (
                <p className="mt-5 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
                  Entrega grátis acima de {formatPrice(freeShippingFrom)}
                </p>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {hasIfood() && !preLaunch && (
                  <a
                    href={business.delivery.ifoodUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-acai-900 transition-colors hover:animate-pulse-soft hover:bg-acai-50"
                  >
                    Pedir no iFood
                  </a>
                )}
                <a
                  href={whatsappUrl(preLaunch ? business.preLaunchMessage : business.whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3 text-sm font-bold text-white transition-colors hover:animate-pulse-soft hover:bg-white/10"
                >
                  {preLaunch ? 'Entrar na lista' : 'Pedir no WhatsApp'}
                </a>
              </div>
            </div>

            <ol className="flex flex-col gap-4">
              {steps.map((step, index) => (
                <li
                  key={step.title}
                  className="flex gap-4 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 transition-colors hover:animate-pulse-soft hover:bg-white/10 hover:ring-white/25"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-sm font-extrabold text-acai-900">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-bold">{step.title}</span>
                    <span className="mt-1 block text-sm text-acai-100">{step.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
