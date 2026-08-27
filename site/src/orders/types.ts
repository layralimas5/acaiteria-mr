import type { CartItem } from '../cart/CartContext'

export type OrderStatus = 'novo' | 'preparando' | 'entrega' | 'concluido' | 'cancelado'

export type PaymentMethod = 'online' | 'pix' | 'dinheiro' | 'cartao'

/**
 * Onde o pagamento está.
 *
 * `na_entrega` é o caso de sempre: o cliente paga quando o motoboy chega, e
 * não existe cobrança para acompanhar. Os outros três só aparecem em pedido
 * que passou pelo checkout da InfinitePay.
 */
export type PaymentStatus = 'na_entrega' | 'aguardando' | 'pago' | 'falhou'

export interface Customer {
  readonly name: string
  readonly phone: string
  /** Rua e número. O bairro e o município têm campo próprio. */
  readonly address: string
  /** Bairro da entrega. Ausente nos pedidos anteriores ao campo existir. */
  readonly district?: string
  /**
   * Município da entrega, digitado no checkout. É o que define a taxa.
   * Ausente nos pedidos feitos antes de a loja atender mais de uma cidade.
   */
  readonly city?: string
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
  /** Soma dos itens, sem entrega. Ausente em pedidos criados antes da taxa existir. */
  readonly subtotal?: number
  /** Taxa cobrada nesse pedido. 0 quando a entrega saiu grátis. */
  readonly deliveryFee?: number
  /** O que o cliente paga: subtotal + entrega. */
  readonly total: number
  /** Quando o cliente confirmou que recebeu. `null` enquanto não confirmar. */
  readonly confirmedAt?: string | null
  /** Estado da cobrança. Ausente em pedidos anteriores ao pagamento online. */
  readonly paymentStatus?: PaymentStatus
  /** Comprovante da InfinitePay, quando o pedido foi pago pelo site. */
  readonly paymentReceiptUrl?: string | null
  /** Quando o pagamento foi confirmado. `null` enquanto não cair. */
  readonly paidAt?: string | null
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
  online: 'Cartão de crédito',
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  cartao: 'Cartão na entrega',
}

/** Linha de apoio de cada forma de pagamento, mostrada no checkout. */
export const paymentHints: Readonly<Record<PaymentMethod, string>> = {
  online: 'Paga agora, em até 12x, direto no sistema',
  pix: 'O QR Code e o copia e cola aparecem aqui na hora',
  dinheiro: 'Diga abaixo se precisa de troco',
  cartao: 'Crédito ou débito na maquininha, na entrega',
}

export const paymentStatusLabels: Readonly<Record<PaymentStatus, string>> = {
  na_entrega: 'Paga na entrega',
  aguardando: 'Aguardando pagamento',
  pago: 'Pago',
  falhou: 'Pagamento não concluído',
}

/** Ordem em que os status aparecem no painel. */
export const statusFlow: readonly OrderStatus[] = ['novo', 'preparando', 'entrega', 'concluido']

export const nextStatus = (status: OrderStatus): OrderStatus | null => {
  const index = statusFlow.indexOf(status)
  if (index < 0 || index === statusFlow.length - 1) return null
  return statusFlow[index + 1] ?? null
}
