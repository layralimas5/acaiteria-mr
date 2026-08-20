import { business, type OpeningHour, type WeekDay } from '../config/business'

/**
 * Camada de pedido. Hoje o pedido sai por iFood (deep link) ou WhatsApp.
 * Quando a integração oficial do iFood (Portal do Desenvolvedor) estiver
 * homologada, só esta camada muda, os componentes continuam iguais.
 */

export const hasIfood = (): boolean => business.delivery.ifoodUrl.trim().length > 0

export const formatPrice = (value: number): string =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const whatsappUrl = (message: string = business.whatsappMessage): string =>
  `https://wa.me/${business.whatsappNumber}?text=${encodeURIComponent(message)}`

/** Telefone da loja no formato que o cliente lê: (27) 99285-3101. */
export const whatsappDisplay = (): string => {
  const local = business.whatsappNumber.replace(/\D/g, '').replace(/^55/, '')
  const area = local.slice(0, 2)
  const number = local.slice(2)
  if (area.length < 2 || number.length < 8) return business.whatsappNumber
  const split = number.length > 8 ? 5 : 4
  return `(${area}) ${number.slice(0, split)}-${number.slice(split)}`
}

/**
 * Taxa de entrega de um pedido. Zera sozinha quando o subtotal alcança
 * `freeShippingFrom`. A regra vive aqui, nunca dentro de componente.
 */
export const deliveryFee = (subtotal: number): number => {
  const { fee, freeShippingFrom } = business.delivery
  if (freeShippingFrom !== null && subtotal >= freeShippingFrom) return 0
  return fee
}

/** Quanto falta para a entrega sair de graça. 0 quando já está grátis ou a regra não existe. */
export const missingForFreeShipping = (subtotal: number): number => {
  const { freeShippingFrom } = business.delivery
  if (freeShippingFrom === null || subtotal >= freeShippingFrom) return 0
  return freeShippingFrom - subtotal
}

/** Localização em texto, omitindo o bairro enquanto ele não estiver definido. */
export const locationLabel = (): string => {
  const { district, city, state } = business.address
  return [district, `${city}/${state}`].filter((part) => part.length > 0).join(', ')
}

export interface OpenStatus {
  readonly isOpen: boolean
  readonly label: string
}

const dayIndexToKey = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return (hours ?? 0) * 60 + (minutes ?? 0)
}

/** Semana na ordem em que o cliente lê, começando na segunda. */
const weekOrder: readonly WeekDay[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']

const dayNames: Readonly<Record<WeekDay, string>> = {
  seg: 'Segunda-feira',
  ter: 'Terça-feira',
  qua: 'Quarta-feira',
  qui: 'Quinta-feira',
  sex: 'Sexta-feira',
  sab: 'Sábado',
  dom: 'Domingo',
}

/** Um dia da semana já resolvido: ou tem faixa de atendimento, ou está fechado. */
export interface DaySchedule {
  readonly key: WeekDay
  readonly name: string
  readonly isToday: boolean
  /** null nos dias em que a loja não abre. */
  readonly hour: OpeningHour | null
}

const hourOf = (day: WeekDay): OpeningHour | null =>
  business.hours.find((hour) => hour.days.some((key) => key === day)) ?? null

/** Os sete dias da semana, com a faixa de cada um e o dia de hoje marcado. */
export const weeklySchedule = (now: Date): readonly DaySchedule[] => {
  const todayKey = dayIndexToKey[now.getDay()]

  return weekOrder.map((key) => ({
    key,
    name: dayNames[key],
    isToday: key === todayKey,
    hour: hourOf(key),
  }))
}

/** Dias em que a loja não abre, escritos por extenso. Vazio quando abre todo dia. */
export const closedDaysLabel = (): string => {
  const closed = weekOrder.filter((day) => hourOf(day) === null).map((day) => dayNames[day])
  if (closed.length === 0) return ''
  if (closed.length === 1) return closed[0] ?? ''
  return `${closed.slice(0, -1).join(', ')} e ${closed[closed.length - 1]}`
}

/** Próximo dia de atendimento a partir de amanhã, para quando hoje já fechou. */
const nextOpenDay = (now: Date): DaySchedule | null => {
  const todayIndex = weekOrder.indexOf(dayIndexToKey[now.getDay()])
  if (todayIndex < 0) return null

  for (let ahead = 1; ahead <= 7; ahead += 1) {
    const key = weekOrder[(todayIndex + ahead) % weekOrder.length]
    if (key === undefined) continue
    const hour = hourOf(key)
    if (hour) {
      return { key, name: dayNames[key], isToday: false, hour }
    }
  }
  return null
}

/**
 * Status de funcionamento com base no horário configurado. Quando está fechado,
 * o rótulo diz quando abre de novo, em vez de só avisar que fechou.
 */
export const openStatus = (now: Date): OpenStatus => {
  const dayKey = dayIndexToKey[now.getDay()]
  const current = now.getHours() * 60 + now.getMinutes()
  const today = hourOf(dayKey)

  if (today) {
    const opens = toMinutes(today.opensAt)
    const closes = toMinutes(today.closesAt)

    if (current >= opens && current < closes) {
      return { isOpen: true, label: `Aberto até ${today.closesAt}` }
    }
    if (current < opens) {
      return { isOpen: false, label: `Abre hoje às ${today.opensAt}` }
    }
  }

  const next = nextOpenDay(now)
  if (!next?.hour) return { isOpen: false, label: 'Fechado' }

  const weekday = next.name.replace('-feira', '')
  return { isOpen: false, label: `Fechado · abre ${weekday.toLowerCase()} às ${next.hour.opensAt}` }
}
