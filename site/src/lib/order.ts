import {
  business,
  type DeliveryArea,
  type DistrictFee,
  type OpeningHour,
  type WeekDay,
} from '../config/business'
import { foldCase } from './text'

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

// ---------------------------------------------------------------------------
// Área de entrega
// ---------------------------------------------------------------------------

/** Municípios atendidos, na ordem em que o checkout mostra. */
export const deliveryAreas = (): readonly DeliveryArea[] => business.delivery.areas

/** Município padrão do checkout: onde a loja fica. */
export const defaultDeliveryArea = (): DeliveryArea | null =>
  business.delivery.areas[0] ?? null

/**
 * Onde o cliente mora, do jeito que ele escreveu. O bairro pode aparecer tanto
 * no campo de bairro quanto no de município ("Campo Grande"), então os dois
 * entram na busca da taxa.
 */
export interface DeliveryPlace {
  readonly district: string
  readonly city: string
}

/** Bairro e município numa linha só, que é como a taxa é procurada. */
export const placeText = (place: DeliveryPlace): string =>
  `${place.district} ${place.city}`.trim()

/** Bairros com taxa própria de um município. Vazio quando o município é todo igual. */
const districtFees = (area: DeliveryArea): readonly DistrictFee[] => area.districtFees ?? []

/** true quando a taxa do município ainda pode mudar conforme o bairro. */
export const hasDistrictFees = (area: DeliveryArea | null): boolean =>
  area !== null && districtFees(area).length > 0

/**
 * Nomes que apontam para o município: ele próprio e os bairros cadastrados.
 * É o que faz "Campo Grande" e "Marcílio de Noronha" serem aceitos no campo de
 * município, que é como muita gente responde onde mora.
 */
const areaNames = (area: DeliveryArea): readonly string[] => [
  area.city,
  ...districtFees(area).flatMap((entry) => entry.districts),
]

/** Nome inteiro dentro do texto, sem casar pedaço de outra palavra. */
const mentions = (text: string, name: string): boolean =>
  new RegExp(`(^|[^a-z0-9])${foldCase(name)}([^a-z0-9]|$)`).test(text)

/** Município atendido pelo nome, venha ele do formulário ou do pedido salvo. */
export const findDeliveryArea = (city: string): DeliveryArea | null => {
  const typed = foldCase(city)
  if (typed === '') return null
  return (
    deliveryAreas().find((area) => areaNames(area).some((name) => foldCase(name) === typed)) ?? null
  )
}

/**
 * Bairro com taxa própria dentro do município, procurado em tudo que o cliente
 * escreveu sobre onde mora. `null` quando vale a taxa base do município.
 */
export const findDistrictFee = (
  area: DeliveryArea | null,
  address: string,
): DistrictFee | null => {
  if (area === null) return null
  const text = foldCase(address)
  if (text === '') return null
  return (
    districtFees(area).find((entry) =>
      entry.districts.some((district) => mentions(text, district)),
    ) ?? null
  )
}

/** Como o cliente lê o destino da entrega: o bairro quando ele tem taxa própria. */
export const deliveryPlaceLabel = (area: DeliveryArea, address: string): string =>
  findDistrictFee(area, address)?.districts[0] ?? area.city

/**
 * Município reconhecido no endereço que o cliente digitou. É o que faz a taxa
 * de Cariacica aparecer sozinha quando ele escreve o bairro e a cidade na
 * mesma linha, sem precisar mexer no seletor.
 */
export const detectDeliveryArea = (address: string): DeliveryArea | null => {
  const text = foldCase(address)
  if (text === '') return null

  // A cidade costuma fechar o endereço ("Rua Viana, 10, Campo Grande,
  // Cariacica"), então vale a que aparece por último: nome de rua no começo
  // não rouba a vez do município no fim.
  const found = deliveryAreas()
    .map((area) => ({
      area,
      at: areaNames(area).reduce((last, name) => {
        const at = text.search(new RegExp(`(^|[^a-z0-9])${foldCase(name)}([^a-z0-9]|$)`))
        return at > last ? at : last
      }, -1),
    }))
    .filter((match) => match.at >= 0)
    .sort((a, b) => b.at - a.at)

  return found[0]?.area ?? null
}

/** Município mais barato, usado como piso antes de o cliente dizer onde mora. */
export const cheapestDeliveryArea = (): DeliveryArea | null =>
  deliveryAreas().reduce<DeliveryArea | null>(
    (lowest, area) => (lowest === null || area.fee < lowest.fee ? area : lowest),
    null,
  )

/**
 * Taxa de entrega de um pedido. Depende do município e zera sozinha quando o
 * subtotal alcança `freeShippingFrom`. A regra vive aqui, nunca dentro de
 * componente. Sem município escolhido, vale a taxa do município padrão.
 */
export const deliveryFee = (
  subtotal: number,
  area: DeliveryArea | null = null,
  /** Bairro e município como o cliente escreveu: é o que revela a taxa do bairro. */
  address = '',
): number => {
  const { freeShippingFrom } = business.delivery
  if (freeShippingFrom !== null && subtotal >= freeShippingFrom) return 0
  const charged = area ?? defaultDeliveryArea()
  if (charged === null) return 0
  return findDistrictFee(charged, address)?.fee ?? charged.fee
}

/** Quanto falta para a entrega sair de graça. 0 quando já está grátis ou a regra não existe. */
export const missingForFreeShipping = (subtotal: number): number => {
  const { freeShippingFrom } = business.delivery
  if (freeShippingFrom === null || subtotal >= freeShippingFrom) return 0
  return freeShippingFrom - subtotal
}

/** Municípios atendidos escritos por extenso: "Viana e Cariacica". */
export const deliveryAreasLabel = (): string => {
  const cities = deliveryAreas().map((area) => area.city)
  if (cities.length === 0) return ''
  if (cities.length === 1) return cities[0] ?? ''
  return `${cities.slice(0, -1).join(', ')} e ${cities[cities.length - 1]}`
}

// ---------------------------------------------------------------------------
// Retirada no local
// ---------------------------------------------------------------------------

/** true quando a loja aceita o cliente buscar o pedido. */
export const hasPickup = (): boolean => business.pickup.enabled

/**
 * Endereço da retirada em uma linha. Vazio enquanto a loja não tiver a rua
 * configurada: nesse caso a tela mostra `business.pickup.note` no lugar, em vez
 * de mandar o cliente para um endereço que não existe.
 */
export const pickupAddress = (): string => {
  const { street, district, city, state } = business.address
  if (street.trim() === '') return ''
  return [street, district, `${city}/${state}`].filter((part) => part.trim() !== '').join(', ')
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
/**
 * O que o cliente lê quando tenta pedir com a loja fechada.
 *
 * São três situações diferentes, e tratar as três como "estamos fechados" faz
 * o cliente ir embora sem saber quando voltar: ainda vai abrir hoje, já fechou
 * por hoje, ou hoje a loja nem abre.
 */
export interface ClosedNotice {
  readonly title: string
  readonly detail: string
}

const nextOpeningLabel = (now: Date): string => {
  const next = nextOpenDay(now)
  if (!next?.hour) return 'Chame a gente no WhatsApp para combinar.'
  const weekday = next.name.replace('-feira', '').toLowerCase()
  return `A gente volta ${weekday} às ${next.hour.opensAt}.`
}

export const closedNotice = (now: Date): ClosedNotice => {
  const today = hourOf(dayIndexToKey[now.getDay()])
  const current = now.getHours() * 60 + now.getMinutes()

  if (today && current < toMinutes(today.opensAt)) {
    return {
      title: 'Ainda não abrimos hoje',
      detail: `Os pedidos abrem hoje às ${today.opensAt}. Enquanto isso, dá para ver o cardápio à vontade.`,
    }
  }

  if (today) {
    return {
      title: 'O expediente de hoje acabou',
      detail: `Fechamos às ${today.closesAt} e não estamos recebendo pedidos agora. ${nextOpeningLabel(now)}`,
    }
  }

  return {
    title: 'Hoje a gente não abre',
    detail: `Não estamos recebendo pedidos hoje. ${nextOpeningLabel(now)}`,
  }
}

/** true quando a loja está no horário de atender e pode receber pedido. */
export const isStoreOpen = (now: Date): boolean => openStatus(now).isOpen

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
