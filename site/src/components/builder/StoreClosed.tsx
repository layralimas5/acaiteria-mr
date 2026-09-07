import { business } from '../../config/business'
import { closedNotice, weeklySchedule, whatsappUrl } from '../../lib/order'

interface StoreClosedProps {
  /** Hora usada para decidir o aviso. Vem do relógio da loja, não de `new Date()`. */
  readonly now: Date
}

/**
 * O montador com a loja fechada.
 *
 * Fora do expediente ninguém monta pedido: o que apareceria como "enviar
 * pedido" viraria um pedido que a cozinha só veria no dia seguinte, com o
 * cliente esperando em casa. Em vez de aceitar e decepcionar, a seção diz que
 * está fechado, quando abre de novo e deixa o WhatsApp à mão para quem quiser
 * combinar mesmo assim.
 *
 * O cardápio continua no ar acima desta seção: ver preço e tamanho não depende
 * de a loja estar aberta.
 */
export function StoreClosed({ now }: StoreClosedProps) {
  const notice = closedNotice(now)
  const week = weeklySchedule(now)

  return (
    <div className="text-center">
      <span
        aria-hidden="true"
        className="mx-auto grid size-14 place-items-center rounded-full bg-acai-50 text-acai-800"
      >
        <svg viewBox="0 0 24 24" className="size-7 fill-none stroke-current stroke-[1.8]">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>

      <h3 className="mt-4 text-xl font-extrabold leading-tight tracking-tight text-ink sm:text-2xl">
        {notice.title}
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">{notice.detail}</p>

      <dl className="mx-auto mt-6 max-w-sm divide-y divide-acai-100 rounded-2xl border border-acai-100 text-left">
        {week.map((day) => (
          <div
            key={day.key}
            className={`flex items-center justify-between gap-4 px-4 py-2.5 text-sm ${
              day.isToday ? 'bg-acai-50/70' : ''
            }`}
          >
            <dt className={day.isToday ? 'font-bold text-ink' : 'text-muted'}>
              {day.name.replace('-feira', '')}
              {day.isToday && <span className="ml-1.5 text-xs font-semibold text-acai-700">hoje</span>}
            </dt>
            <dd className={day.hour ? 'font-semibold text-ink' : 'text-muted'}>
              {day.hour ? `${day.hour.opensAt} às ${day.hour.closesAt}` : 'Fechado'}
            </dd>
          </div>
        ))}
      </dl>

      <a
        href={whatsappUrl(`Oi! Vi que vocês estão fechados agora. Que horas abrem?`)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center justify-center rounded-full border border-acai-200 px-6 py-3 text-sm font-bold text-acai-800 transition-colors hover:bg-acai-50"
      >
        Falar com a {business.shortName} no WhatsApp
      </a>
    </div>
  )
}
