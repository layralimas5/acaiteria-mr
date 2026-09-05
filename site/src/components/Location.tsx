import { useState } from 'react'
import { business } from '../config/business'
import {
  closedDaysLabel,
  deliveryAreasLabel,
  locationLabel,
  openStatus,
  weeklySchedule,
  whatsappUrl,
} from '../lib/order'

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

  /*
    A semana inteira são sete linhas, quase um terço de tela num celular, para
    responder uma pergunta que quase sempre é "vocês estão abertos agora?". No
    celular fica só o dia de hoje e o resto abre no toque; do tablet para cima
    a tabela continua inteira, como sempre foi.
  */
  const [showAllDays, setShowAllDays] = useState(false)

  return (
    <section id="onde-estamos" className="scroll-mt-20 bg-acai-50 py-11 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-6 px-5 lg:grid-cols-2 lg:items-center lg:gap-10">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-acai-700">
            {deliveryOnly ? 'Área de entrega' : 'Onde estamos'}
          </span>
          <h2 className="mt-1.5 text-[clamp(1.5rem,6vw,2.25rem)] font-extrabold tracking-tight text-ink max-sm:leading-[1.12] sm:mt-2 sm:text-4xl">
            {deliveryOnly ? 'A gente leva até você' : 'Passa na loja ou chama pelo delivery'}
          </h2>

          {deliveryOnly && (
            <p className="mt-2.5 max-w-md text-[clamp(0.9375rem,3.7vw,1rem)] leading-[1.5] text-muted sm:mt-4 sm:leading-relaxed">
              Trabalhamos só com entrega, sem atendimento no balcão. Entregamos em{' '}
              {deliveryAreasLabel() || address.city}.
            </p>
          )}

          <address className="mt-3 not-italic text-sm leading-relaxed text-muted sm:mt-6 sm:text-base">
            {locationLabel()}
          </address>

          <a
            href={whatsappUrl(
              `Oi! Vocês entregam no meu endereço em ${business.address.city}? Fico em...`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-acai-800 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:animate-pulse-soft hover:bg-acai-900 sm:mt-6 sm:inline-flex sm:w-auto sm:py-3"
          >
            Consultar se entregamos aí
          </a>
        </div>

        <div className="rounded-card border border-acai-100 bg-white p-4 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
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
            <p className="mt-2.5 text-sm leading-[1.5] text-muted sm:mt-3 sm:leading-relaxed">
              A gente abre só à noite, das{' '}
              <strong className="font-semibold text-ink">{shift.opensAt}</strong> às{' '}
              <strong className="font-semibold text-ink">{shift.closesAt}</strong>, em{' '}
              {openDays.length} dias da semana.
            </p>
          )}

          <dl className="mt-3 divide-y divide-acai-100 sm:mt-6">
            {week.map((day) => {
              const closed = day.hour === null
              const hiddenOnPhone = !day.isToday && !showAllDays

              return (
                <div
                  key={day.key}
                  className={`items-center justify-between gap-4 rounded-lg py-2.5 sm:py-3 ${
                    day.isToday ? 'bg-acai-50/80 px-3' : ''
                  } ${hiddenOnPhone ? 'hidden sm:flex' : 'flex'}`}
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
                      <span className="rounded-full bg-acai-800 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
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

          <button
            type="button"
            onClick={() => setShowAllDays((open) => !open)}
            aria-expanded={showAllDays}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full border border-acai-200 py-2.5 text-[0.8125rem] font-bold text-acai-800 sm:hidden"
          >
            {showAllDays ? 'Mostrar só hoje' : 'Ver a semana toda'}
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className={`size-3.5 fill-none stroke-current stroke-[2.5] transition-transform ${
                showAllDays ? 'rotate-180' : ''
              }`}
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="mt-4 space-y-1.5 border-t border-acai-100 pt-3.5 text-sm leading-[1.5] text-muted sm:mt-6 sm:space-y-2 sm:pt-5 sm:leading-relaxed">
            {closedDays && (
              <p>
                <span className="font-semibold text-ink">{closedDays}</span> a gente não abre.
              </p>
            )}
            {shift && (
              <p>
                Dá pra pedir até {shift.closesAt}, e a entrega chega a partir de{' '}
                {business.delivery.minMinutes} minutos depois da confirmação.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
