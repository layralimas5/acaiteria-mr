import type { CartItem } from '../cart/CartContext'
import type { Customer, Order } from './types'

/**
 * Último pedido feito neste navegador.
 *
 * É o que permite oferecer "pedir de novo" na chegada, e pré-preencher o
 * checkout com nome, telefone e endereço de quem já pediu. Vive separado dos
 * pedidos da loja (`orders/store.ts`): aquilo é o painel, isto é o cliente.
 */

const STORAGE_KEY = 'acaiteria-mr:last-order'

export interface LastOrder {
  readonly code: string
  readonly createdAt: string
  readonly items: readonly CartItem[]
  readonly customer: Customer
  readonly total: number
}

export const saveLastOrder = (order: Order): void => {
  const last: LastOrder = {
    code: order.code,
    createdAt: order.createdAt,
    items: order.items,
    customer: order.customer,
    total: order.total,
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(last))
  } catch {
    // Sem storage: o cliente só perde o atalho de repetir o pedido.
  }
}

export const readLastOrder = (): LastOrder | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null

    const last = parsed as LastOrder
    return Array.isArray(last.items) && last.items.length > 0 ? last : null
  } catch {
    return null
  }
}

export const clearLastOrder = (): void => {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nada a fazer: sem storage não há o que limpar.
  }
}
