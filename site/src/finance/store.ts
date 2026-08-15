/**
 * Caixa da loja: lançamentos manuais de entrada e saída.
 *
 * As vendas do site já entram sozinhas pelos pedidos. Isto aqui é o resto do
 * caixa — compra de insumo, aluguel, venda no balcão, aporte — que o sistema
 * não tem como saber sozinho.
 *
 * Como os pedidos, hoje mora no navegador. A interface é a mesma que o
 * Supabase vai implementar depois.
 */

const STORAGE_KEY = 'acaiteria-mr:finance'
const CHANGED_EVENT = 'acaiteria-mr:finance-changed'

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

export const readEntries = (): readonly FinanceEntry[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as FinanceEntry[]) : []
  } catch {
    return []
  }
}

const write = (entries: readonly FinanceEntry[]): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Sem storage disponível: vale só para a sessão atual.
  }
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT))
}

/** Mais recentes primeiro; empate de data resolve pelo horário do cadastro. */
export const listEntries = (): readonly FinanceEntry[] =>
  readEntries()
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))

export type NewFinanceEntry = Omit<FinanceEntry, 'id' | 'createdAt'>

export const addEntry = (draft: NewFinanceEntry): FinanceEntry => {
  const createdAt = new Date().toISOString()
  const entry: FinanceEntry = {
    ...draft,
    id: `${createdAt}-${Math.round(draft.amount * 100)}`,
    createdAt,
  }
  write([entry, ...readEntries()])
  return entry
}

export const removeEntry = (id: string): void => {
  write(readEntries().filter((entry) => entry.id !== id))
}

/** Avisa quando o caixa mudar, inclusive em outra aba do navegador. */
export const subscribeToEntries = (listener: () => void): (() => void) => {
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
