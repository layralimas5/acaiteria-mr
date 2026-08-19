import { business } from '../config/business'

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

/** Status de funcionamento com base no horário configurado. */
export const openStatus = (now: Date): OpenStatus => {
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
