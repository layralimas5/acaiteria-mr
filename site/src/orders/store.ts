import type { CartItem } from '../cart/CartContext'
import type { Customer, Order, OrderStatus } from './types'

/**
 * Armazenamento dos pedidos.
 *
 * Hoje os pedidos ficam no navegador (localStorage), o que já atende a loja
 * que atende pelo mesmo aparelho/computador do balcão. A interface abaixo é a
 * única porta de entrada dos dados, então trocar por Supabase depois é
 * implementar as mesmas funções — nenhuma tela precisa mudar.
 *
 * Ver `docs/sistema.md` para o passo a passo da migração.
 */

const STORAGE_KEY = 'acaiteria-mr:orders'
const CHANGED_EVENT = 'acaiteria-mr:orders-changed'

const read = (): Order[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Order[]) : []
  } catch {
    return []
  }
}

const write = (orders: readonly Order[]): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
  } catch {
    // Sem storage disponível: o painel segue funcionando na sessão atual.
  }
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT))
}

/** Código curto e legível: 4 dígitos derivados do horário do pedido. */
const buildCode = (createdAt: Date, sequence: number): string => {
  const day = String(createdAt.getDate()).padStart(2, '0')
  return `${day}${String(sequence % 100).padStart(2, '0')}`
}

export const listOrders = (): readonly Order[] =>
  read().sort((a, b) => b.createdAt.localeCompare(a.createdAt))

export const createOrder = (
  items: readonly CartItem[],
  total: number,
  customer: Customer,
): Order => {
  const orders = read()
  const createdAt = new Date()

  const order: Order = {
    id: `${createdAt.getTime()}-${Math.round(total * 100)}`,
    code: buildCode(createdAt, orders.length + 1),
    createdAt: createdAt.toISOString(),
    updatedAt: createdAt.toISOString(),
    status: 'novo',
    customer,
    items,
    total,
  }

  write([order, ...orders])
  return order
}

export const updateOrderStatus = (id: string, status: OrderStatus): void => {
  write(
    read().map((order) =>
      order.id === id ? { ...order, status, updatedAt: new Date().toISOString() } : order,
    ),
  )
}

export const removeOrder = (id: string): void => {
  write(read().filter((order) => order.id !== id))
}

/** Avisa sempre que os pedidos mudarem, inclusive em outra aba do navegador. */
export const subscribeToOrders = (listener: () => void): (() => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener()
  }

  window.addEventListener(CHANGED_EVENT, listener)
  window.addEventListener('storage', onStorage)

  return () => {
    window.removeEventListener(CHANGED_EVENT, listener)
    window.removeEventListener('storage', onStorage)
  }
}
