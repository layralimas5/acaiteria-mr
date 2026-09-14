import { supabase } from '../lib/supabase'
import type { StoreOverride } from '../lib/order'

/**
 * A decisão da equipe sobre receber pedido, no Supabase.
 *
 * É uma linha só, na tabela `store_status`: o modo (`auto`, `open`, `closed`)
 * e até quando ele vale. Qualquer visitante lê (o site precisa saber se mostra
 * o montador); só a equipe escreve, garantido pelo RLS. Quem decide se o pedido
 * entra de verdade é a função `create_order`, que lê a mesma linha.
 */

interface StoreStatusRow {
  mode: StoreOverride['mode']
  until: string | null
}

const fromRow = (row: StoreStatusRow): StoreOverride => ({
  mode: row.mode,
  until: row.until ? new Date(row.until) : null,
})

export const fetchStoreOverride = async (): Promise<StoreOverride> => {
  const { data, error } = await supabase
    .from('store_status')
    .select('mode, until')
    .eq('id', true)
    .single<StoreStatusRow>()

  if (error) throw error
  return fromRow(data)
}

export const saveStoreOverride = async (override: StoreOverride): Promise<void> => {
  const { error } = await supabase
    .from('store_status')
    .update({ mode: override.mode, until: override.until?.toISOString() ?? null })
    .eq('id', true)

  if (error) throw error
}

/**
 * Avisa quando a decisão mudar, em qualquer aparelho: a loja fecha no painel
 * e o montador some do celular do cliente sem ele recarregar nada.
 */
export const subscribeToStoreOverride = (listener: () => void): (() => void) => {
  const channel = supabase
    .channel('store-status-changes')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'store_status' }, listener)
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
