import type { CartItem } from '../cart/CartContext'
import { supabase } from '../lib/supabase'
import type { Customer, Order, OrderStatus } from './types'

/**
 * Pedidos, no Supabase.
 *
 * Esta é a única porta de entrada dos pedidos: nenhuma tela conhece nome de
 * tabela ou coluna. O site insere (permitido para qualquer visitante) e o
 * painel lê e atualiza (exige login, garantido pelo RLS no banco).
 */

interface OrderRow {
  id: string
  code: string
  status: OrderStatus
  customer: Customer
  items: readonly CartItem[]
  subtotal: number
  delivery_fee: number
  total: number
  confirmed_at: string | null
  created_at: string
  updated_at: string
}

const SELECT =
  'id, code, status, customer, items, subtotal, delivery_fee, total, confirmed_at, created_at, updated_at'

const toOrder = (row: OrderRow): Order => ({
  id: row.id,
  code: row.code,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  status: row.status,
  customer: row.customer,
  items: row.items,
  subtotal: Number(row.subtotal),
  deliveryFee: Number(row.delivery_fee),
  total: Number(row.total),
  confirmedAt: row.confirmed_at,
})

export const listOrders = async (): Promise<readonly Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select(SELECT)
    .order('created_at', { ascending: false })

  if (error) throw error
  return ((data ?? []) as OrderRow[]).map(toOrder)
}

interface CreatedRow {
  id: string
  code: string
  created_at: string
}

/**
 * Cria o pedido e devolve o número que o cliente vai usar.
 *
 * Passa por uma função do banco de propósito: o cliente não pode ler a tabela
 * de pedidos, que guarda dados de outras pessoas, então um insert que devolve
 * a linha inteira esbarraria no RLS. A função grava, calcula o total e
 * devolve só o identificador, o número e a hora deste pedido.
 */
export const createOrder = async (
  items: readonly CartItem[],
  subtotal: number,
  deliveryFee: number,
  customer: Customer,
): Promise<Order> => {
  const { data, error } = await supabase.rpc('create_order', {
    p_customer: customer,
    p_items: items,
    p_subtotal: subtotal,
    p_delivery_fee: deliveryFee,
  })

  if (error) throw error

  const created = (data as CreatedRow[] | null)?.[0]
  if (!created) throw new Error('O pedido não foi criado. Tente de novo.')

  return {
    id: created.id,
    code: created.code,
    createdAt: created.created_at,
    updatedAt: created.created_at,
    status: 'novo',
    customer,
    items,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    confirmedAt: null,
  }
}

export const updateOrderStatus = async (id: string, status: OrderStatus): Promise<void> => {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) throw error
}

export const removeOrder = async (id: string): Promise<void> => {
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) throw error
}

/**
 * Confirmação de recebimento, disparada pelo cliente no link do WhatsApp.
 *
 * Passa por uma função do banco de propósito: o cliente não pode ler nem
 * escrever na tabela de pedidos, que guarda dados de outras pessoas. Ele só
 * consegue carimbar a confirmação do pedido cujo número tem em mãos.
 */
export const confirmOrder = async (code: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('confirm_order', { p_code: code })
  if (error) throw error
  return data === true
}

/**
 * Avisa sempre que os pedidos mudarem, em qualquer aparelho.
 *
 * É o Realtime do Supabase: pedido feito no celular do cliente aparece no
 * computador da loja na hora, sem recarregar a página.
 */
export const subscribeToOrders = (listener: () => void): (() => void) => {
  const channel = supabase
    .channel('orders-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, listener)
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
