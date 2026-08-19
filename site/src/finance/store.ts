import { createEmitter } from '../lib/emitter'
import { supabase } from '../lib/supabase'

/**
 * Caixa da loja: lançamentos manuais de entrada e saída.
 *
 * As vendas do site já entram sozinhas pelos pedidos. Isto aqui é o resto do
 * caixa (compra de insumo, aluguel, venda no balcão, aporte) que o sistema não
 * tem como saber sozinho.
 *
 * Vive no Supabase e só quem entrou no painel enxerga.
 */

export type EntryType = 'entrada' | 'saida'

export interface FinanceEntry {
  readonly id: string
  /** Data do lançamento no formato `yyyy-mm-dd`. */
  readonly date: string
  readonly type: EntryType
  readonly description: string
  readonly category: string
  readonly amount: number
  readonly createdAt: string
}

export const entryCategories: Readonly<Record<EntryType, readonly string[]>> = {
  entrada: ['Venda no balcão', 'Aporte', 'Reembolso', 'Outros'],
  saida: [
    'Insumos',
    'Embalagens',
    'Entregador',
    'Aluguel',
    'Energia e água',
    'Salários',
    'Marketing',
    'Taxas e impostos',
    'Outros',
  ],
}

interface EntryRow {
  id: string
  entry_date: string
  type: EntryType
  description: string
  category: string
  amount: number
  created_at: string
}

const changed = createEmitter()

const toEntry = (row: EntryRow): FinanceEntry => ({
  id: row.id,
  date: row.entry_date,
  type: row.type,
  description: row.description,
  category: row.category,
  amount: Number(row.amount),
  createdAt: row.created_at,
})

/** Mais recentes primeiro; empate de data resolve pelo horário do cadastro. */
export const listEntries = async (): Promise<readonly FinanceEntry[]> => {
  const { data, error } = await supabase
    .from('finance_entries')
    .select('*')
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return ((data ?? []) as EntryRow[]).map(toEntry)
}

export interface NewFinanceEntry {
  readonly date: string
  readonly type: EntryType
  readonly description: string
  readonly category: string
  readonly amount: number
}

export const addEntry = async (draft: NewFinanceEntry): Promise<void> => {
  const { error } = await supabase.from('finance_entries').insert({
    entry_date: draft.date,
    type: draft.type,
    description: draft.description.trim(),
    category: draft.category,
    amount: draft.amount,
  })
  if (error) throw error
  changed.emit()
}

export const removeEntry = async (id: string): Promise<void> => {
  const { error } = await supabase.from('finance_entries').delete().eq('id', id)
  if (error) throw error
  changed.emit()
}

/** Avisa as telas abertas quando o caixa mudar. */
export const subscribeToEntries = (listener: () => void): (() => void) =>
  changed.subscribe(listener)
