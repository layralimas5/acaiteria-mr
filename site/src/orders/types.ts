import type { CartItem } from '../cart/CartContext'

export type OrderStatus = 'novo' | 'preparando' | 'entrega' | 'concluido' | 'cancelado'

export type PaymentMethod = 'pix' | 'dinheiro' | 'cartao'

export interface Customer {
  readonly name: string
  readonly phone: string
  readonly address: string
  readonly reference: string
  readonly payment: PaymentMethod
  readonly changeFor: string
  readonly notes: string
}

export interface Order {
  readonly id: string
  /** Número curto que o cliente e a loja usam para se referir ao pedido. */
  readonly code: string
  readonly createdAt: string
  readonly status: OrderStatus
  readonly customer: Customer
  readonly items: readonly CartItem[]
  readonly total: number
  /** Quando saiu do status "novo" pela última vez, para histórico. */
  readonly updatedAt: string
}

export const statusLabels: Readonly<Record<OrderStatus, string>> = {
  novo: 'Novo',
  preparando: 'Preparando',
  entrega: 'Saiu para entrega',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

export const paymentLabels: Readonly<Record<PaymentMethod, string>> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  cartao: 'Cartão na entrega',
}

/** Ordem em que os status aparecem no painel. */
export const statusFlow: readonly OrderStatus[] = ['novo', 'preparando', 'entrega', 'concluido']

export const nextStatus = (status: OrderStatus): OrderStatus | null => {
  const index = statusFlow.indexOf(status)
  if (index < 0 || index === statusFlow.length - 1) return null
  return statusFlow[index + 1] ?? null
}
