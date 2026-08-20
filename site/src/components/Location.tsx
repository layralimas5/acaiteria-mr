import { business } from '../config/business'
import { closedDaysLabel, locationLabel, openStatus, weeklySchedule, whatsappUrl } from '../lib/order'

export function Location() {
  const { address, deliveryOnly } = business
  const now = new Date()
  const status = openStatus(now)
  const week = weeklySchedule(now)
  const closedDays = closedDaysLabel()
  const openDays = week.filter((day) => day.hour !== null)
  const shift = openDays[0]?.hour ?? null
  const sameShiftEveryDay =
    shift !== null &&
    openDays.every((day) => day.hour?.opensAt === shift.opensAt && day.hour?.closesAt === shift.closesAt)

  return (
    <section id="onde-estamos" className="scroll-mt-24 bg-acai-50 py-14 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-acai-700">
            {deliveryOnly ? 'Área de entrega' : 'Onde estamos'}
          </span>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-4xl">
            {deliveryOnly ? 'A gente leva até você' : 'Passa na loja ou chama pelo delivery'}
          </h2>

          {deliveryOnly && (
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
              Trabalhamos só com entrega, sem atendimento no balcão. Atendemos{' '}
              {address.city} e região.
            </p>
          )}

          <address className="mt-6 not-italic text-base leading-relaxed text-muted">
            {locationLabel()}
          </address>

          <a
            href={whatsappUrl(
              `Oi! Vocês entregam no meu endereço em ${business.address.city}? Fico em...`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-acai-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:animate-pulse-soft hover:bg-acai-900"
          >
            Consultar se entregamos aí
          </a>
        </div>

        <div className="rounded-card border border-acai-100 bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-acai-800">
              Horário de funcionamento
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

          {sameShiftEveryDay && shift && (
            <p className="mt-3 text-sm leading-relaxed text-muted">
              A gente abre só à noite, das{' '}
              <strong className="font-semibold text-ink">{shift.opensAt}</strong> às{' '}
              <strong className="font-semibold text-ink">{shift.closesAt}</strong>, em{' '}
              {openDays.length} dias da semana.
            </p>
          )}

          <dl className="mt-6 divide-y divide-acai-100">
            {week.map((day) => {
              const closed = day.hour === null

              return (
                <div
                  key={day.key}
                  className={`flex items-center justify-between gap-4 rounded-lg py-3 ${
                    day.isToday ? 'bg-acai-50/80 px-3' : ''
                  }`}
                >
                  <dt className="flex items-center gap-2">
                    <span
                      className={`text-sm ${
                        closed ? 'text-muted/60' : day.isToday ? 'font-semibold text-ink' : 'text-muted'
                      }`}
                    >
                      {day.name}
                    </span>
                    {day.isToday && (
                      <span className="rounded-full bg-acai-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Hoje
                      </span>
                    )}
                  </dt>
                  <dd
                    className={`text-sm tabular-nums ${
                      closed ? 'text-muted/60' : 'font-semibold text-ink'
                    }`}
                  >
                    {closed ? 'Fechado' : `${day.hour?.opensAt} às ${day.hour?.closesAt}`}
                  </dd>
                </div>
              )
            })}
          </dl>

          <div className="mt-6 space-y-2 border-t border-acai-100 pt-5 text-sm leading-relaxed text-muted">
            {closedDays && (
              <p>
                <span className="font-semibold text-ink">{closedDays}</span> a gente não abre.
              </p>
            )}
            {shift && (
              <p>
                Dá pra pedir até {shift.closesAt}, e a entrega leva em média{' '}
                {business.delivery.averageMinutes} minutos.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
