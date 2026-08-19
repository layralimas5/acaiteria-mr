import { createEmitter } from '../lib/emitter'
import { supabase } from '../lib/supabase'

/**
 * Estoque interno: o que a loja tem para produzir.
 *
 * Nada aqui aparece no site. Isto é a despensa (polpa, granola, copo, colher)
 * com quantidade, mínimo de segurança e o histórico de tudo que entrou e saiu.
 * O que o cliente vê é o cardápio, em `src/catalog/`.
 *
 * Vive no Supabase e só quem entrou no painel enxerga: o RLS não libera nem
 * leitura para visitante.
 */

export type Unit = 'kg' | 'g' | 'l' | 'ml' | 'un' | 'cx' | 'pct'

export const unitLabels: Readonly<Record<Unit, string>> = {
  kg: 'kg',
  g: 'g',
  l: 'L',
  ml: 'ml',
  un: 'un',
  cx: 'caixa',
  pct: 'pacote',
}

export const categories: readonly string[] = [
  'Polpas e bases',
  'Complementos',
  'Embalagens',
  'Bebidas',
  'Limpeza',
  'Outros',
]

export interface InventoryItem {
  readonly id: string
  readonly name: string
  readonly category: string
  readonly unit: Unit
  readonly quantity: number
  /** Abaixo disso o painel pede reposição. */
  readonly minQuantity: number
  readonly createdAt: string
  readonly updatedAt: string
}

export type MovementType = 'entrada' | 'saida'

export interface Movement {
  readonly id: string
  readonly itemId: string
  readonly itemName: string
  readonly type: MovementType
  readonly quantity: number
  readonly unit: Unit
  readonly reason: string
  /** Quanto custou a compra, quando for entrada paga. */
  readonly cost?: number
  readonly createdAt: string
}

export const movementReasons: Readonly<Record<MovementType, readonly string[]>> = {
  entrada: ['Compra', 'Devolução', 'Ajuste de contagem'],
  saida: ['Produção', 'Perda ou quebra', 'Vencimento', 'Ajuste de contagem'],
}

interface ItemRow {
  id: string
  name: string
  category: string
  unit: Unit
  quantity: number
  min_quantity: number
  created_at: string
  updated_at: string
}

interface MovementRow {
  id: string
  item_id: string
  item_name: string
  type: MovementType
  quantity: number
  unit: Unit
  reason: string
  cost: number | null
  created_at: string
}

const changed = createEmitter()

const toItem = (row: ItemRow): InventoryItem => ({
  id: row.id,
  name: row.name,
  category: row.category,
  unit: row.unit,
  quantity: Number(row.quantity),
  minQuantity: Number(row.min_quantity),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const toMovement = (row: MovementRow): Movement => ({
  id: row.id,
  itemId: row.item_id,
  itemName: row.item_name,
  type: row.type,
  quantity: Number(row.quantity),
  unit: row.unit,
  reason: row.reason,
  ...(row.cost !== null && { cost: Number(row.cost) }),
  createdAt: row.created_at,
})

export const listItems = async (): Promise<readonly InventoryItem[]> => {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('category')
    .order('name')

  if (error) throw error
  return ((data ?? []) as ItemRow[]).map(toItem)
}

export const listMovements = async (): Promise<readonly Movement[]> => {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300)

  if (error) throw error
  return ((data ?? []) as MovementRow[]).map(toMovement)
}

export interface NewInventoryItem {
  readonly name: string
  readonly category: string
  readonly unit: Unit
  readonly quantity: number
  readonly minQuantity: number
}

export const addItem = async (draft: NewInventoryItem): Promise<void> => {
  const { error } = await supabase.from('inventory_items').insert({
    name: draft.name.trim(),
    category: draft.category,
    unit: draft.unit,
    quantity: draft.quantity,
    min_quantity: draft.minQuantity,
  })
  if (error) throw error
  changed.emit()
}

/** Cadastra vários de uma vez, para a lista sugerida de quem está começando. */
export const addItems = async (drafts: readonly NewInventoryItem[]): Promise<void> => {
  if (drafts.length === 0) return

  const { error } = await supabase.from('inventory_items').insert(
    drafts.map((draft) => ({
      name: draft.name.trim(),
      category: draft.category,
      unit: draft.unit,
      quantity: draft.quantity,
      min_quantity: draft.minQuantity,
    })),
  )
  if (error) throw error
  changed.emit()
}

export const updateItem = async (id: string, patch: Partial<NewInventoryItem>): Promise<void> => {
  const { error } = await supabase
    .from('inventory_items')
    .update({
      ...(patch.name !== undefined && { name: patch.name.trim() }),
      ...(patch.category !== undefined && { category: patch.category }),
      ...(patch.unit !== undefined && { unit: patch.unit }),
      ...(patch.quantity !== undefined && { quantity: patch.quantity }),
      ...(patch.minQuantity !== undefined && { min_quantity: patch.minQuantity }),
    })
    .eq('id', id)

  if (error) throw error
  changed.emit()
}

export const removeItem = async (id: string): Promise<void> => {
  const { error } = await supabase.from('inventory_items').delete().eq('id', id)
  if (error) throw error
  changed.emit()
}

export interface NewMovement {
  readonly itemId: string
  readonly type: MovementType
  readonly quantity: number
  readonly reason: string
  readonly cost?: number
}

/**
 * Registra a movimentação e ajusta o saldo do insumo.
 *
 * As duas coisas acontecem dentro de uma função do banco, numa transação só:
 * não existe movimentação sem saldo novo nem saldo novo sem movimentação.
 */
export const registerMovement = async (draft: NewMovement): Promise<Movement | null> => {
  const { data, error } = await supabase.rpc('register_movement', {
    p_item_id: draft.itemId,
    p_type: draft.type,
    p_quantity: draft.quantity,
    p_reason: draft.reason,
    p_cost: draft.cost ?? null,
  })

  if (error) throw error
  changed.emit()
  return data ? toMovement(data as MovementRow) : null
}

/** Precisa de reposição: acabou ou está no limite mínimo. */
export const needsRestock = (item: InventoryItem): boolean => item.quantity <= item.minQuantity

/** Lista sugerida para quem está começando a controlar o estoque. */
export const starterItems: readonly NewInventoryItem[] = [
  { name: 'Polpa de açaí', category: 'Polpas e bases', unit: 'kg', quantity: 0, minQuantity: 10 },
  { name: 'Sorvete de creme', category: 'Polpas e bases', unit: 'l', quantity: 0, minQuantity: 5 },
  { name: 'Leite em pó', category: 'Complementos', unit: 'kg', quantity: 0, minQuantity: 2 },
  { name: 'Granola', category: 'Complementos', unit: 'kg', quantity: 0, minQuantity: 3 },
  { name: 'Leite condensado', category: 'Complementos', unit: 'un', quantity: 0, minQuantity: 6 },
  { name: 'Morango', category: 'Complementos', unit: 'kg', quantity: 0, minQuantity: 2 },
  { name: 'Banana', category: 'Complementos', unit: 'kg', quantity: 0, minQuantity: 3 },
  { name: 'Copo 300ml', category: 'Embalagens', unit: 'un', quantity: 0, minQuantity: 100 },
  { name: 'Copo 500ml', category: 'Embalagens', unit: 'un', quantity: 0, minQuantity: 100 },
  { name: 'Colher descartável', category: 'Embalagens', unit: 'un', quantity: 0, minQuantity: 200 },
  { name: 'Sacola de entrega', category: 'Embalagens', unit: 'un', quantity: 0, minQuantity: 50 },
]

/** Avisa as telas abertas quando o estoque mudar. */
export const subscribeToInventory = (listener: () => void): (() => void) =>
  changed.subscribe(listener)
