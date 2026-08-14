import { business } from '../config/business'
import { isPreLaunch, launchLabel, openStatus, whatsappUrl } from '../lib/order'

export function Location() {
  const { address, hours, deliveryOnly } = business
  const status = openStatus(new Date())
  const preLaunch = isPreLaunch()

  return (
    <section id="onde-estamos" className="scroll-mt-24 bg-acai-50 py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-acai-700">
            {deliveryOnly ? 'Área de entrega' : 'Onde estamos'}
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            {deliveryOnly ? 'A gente leva até você' : 'Passa na loja ou chama pelo delivery'}
          </h2>

          {deliveryOnly && (
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
              Trabalhamos só com entrega, sem atendimento no balcão. Saímos de{' '}
              {address.district}, em {address.city}, e atendemos os bairros da região.
            </p>
          )}

          <address className="mt-6 not-italic text-base leading-relaxed text-muted">
            {address.district} — {address.city}/{address.state}
          </address>

          <a
            href={whatsappUrl(
              preLaunch
                ? business.preLaunchMessage
                : 'Oi! Vocês entregam no meu endereço? Fico em...',
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-acai-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:animate-pulse-soft hover:bg-acai-900"
          >
            {preLaunch ? 'Entrar na lista de inauguração' : 'Consultar se entregamos aí'}
          </a>
        </div>

        <div className="rounded-card border border-acai-100 bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-acai-800">
              {preLaunch ? `Horário a partir de ${launchLabel()}` : 'Horário'}
            </h3>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                status.isOpen ? 'bg-green-50 text-green-700' : 'bg-acai-50 text-acai-800'
              }`}
            >
              <span
                aria-hidden="true"
                className={`size-1.5 rounded-full ${status.isOpen ? 'bg-green-600' : 'bg-acai-400'}`}
              />
              {status.label}
            </span>
          </div>

          <dl className="mt-6 divide-y divide-acai-100">
            {hours.map((hour) => (
              <div key={hour.label} className="flex items-center justify-between py-3">
                <dt className="text-sm text-muted">{hour.label}</dt>
                <dd className="text-sm font-semibold text-ink">
                  {hour.opensAt} às {hour.closesAt}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
