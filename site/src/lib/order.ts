import { business } from '../config/business'
import type { Product } from '../data/products'

/**
 * Camada de pedido. Hoje o pedido sai por iFood (deep link) ou WhatsApp.
 * Quando a integração oficial do iFood (Portal do Desenvolvedor) estiver
 * homologada, só esta camada muda — os componentes continuam iguais.
 */

export type OrderChannel = 'ifood' | 'whatsapp'

export const hasIfood = (): boolean => business.delivery.ifoodUrl.trim().length > 0

export const formatPrice = (value: number): string =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const whatsappUrl = (message: string = business.whatsappMessage): string =>
  `https://wa.me/${business.whatsappNumber}?text=${encodeURIComponent(message)}`

const launchAt = (): Date => new Date(`${business.launchDate}T00:00:00`)

/** true enquanto a loja ainda não inaugurou. */
export const isPreLaunch = (now: Date = new Date()): boolean => now < launchAt()

/** Data de inauguração formatada como 05/09. */
export const launchLabel = (): string =>
  launchAt().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

/** Dias que faltam para a inauguração (0 quando já abriu). */
export const daysToLaunch = (now: Date = new Date()): number => {
  const diff = launchAt().getTime() - now.getTime()
  return diff <= 0 ? 0 : Math.ceil(diff / 86_400_000)
}

export const productMessage = (product: Product): string =>
  isPreLaunch()
    ? `Oi! Quero garantir meu *${product.name}* (${product.size}) na inauguração, dia ${launchLabel()}.`
    : `Oi! Quero pedir *${product.name}* (${product.size}) — ${formatPrice(product.price)}.`

/** Texto padrão do CTA de pedido, conforme o momento e o canal. */
export const orderLabel = (): string => {
  if (isPreLaunch()) return 'Avise-me na inauguração'
  return hasIfood() ? 'Peça no iFood' : 'Pedir no WhatsApp'
}

/** Link de pedido para um produto, no canal disponível. */
export const orderUrl = (product?: Product): string => {
  if (isPreLaunch()) {
    return whatsappUrl(product ? productMessage(product) : business.preLaunchMessage)
  }
  if (hasIfood()) return business.delivery.ifoodUrl
  return whatsappUrl(product ? productMessage(product) : business.whatsappMessage)
}

export const orderChannel = (): OrderChannel => (hasIfood() ? 'ifood' : 'whatsapp')

export interface OpenStatus {
  readonly isOpen: boolean
  readonly label: string
}

const dayIndexToKey = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return (hours ?? 0) * 60 + (minutes ?? 0)
}

/** Status de funcionamento com base no horário configurado. */
export const openStatus = (now: Date): OpenStatus => {
  if (isPreLaunch(now)) {
    return { isOpen: false, label: `Inauguração ${launchLabel()}` }
  }

  const dayKey = dayIndexToKey[now.getDay()]
  const current = now.getHours() * 60 + now.getMinutes()

  const today = business.hours.find((hour) => hour.days.some((day) => day === dayKey))
  if (!today) return { isOpen: false, label: 'Fechado hoje' }

  const opens = toMinutes(today.opensAt)
  const closes = toMinutes(today.closesAt)
  const isOpen = current >= opens && current < closes

  return {
    isOpen,
    label: isOpen ? `Aberto até ${today.closesAt}` : `Abre às ${today.opensAt}`,
  }
}
