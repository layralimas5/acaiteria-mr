/**
 * Estoque interno: o que a loja tem para produzir.
 *
 * Nada aqui aparece no site. Isto é a despensa — polpa, granola, copo, colher
 * — com quantidade, mínimo de segurança e o histórico de tudo que entrou e
 * saiu. O que o cliente vê fica em `src/stock/` (aba Site).
 *
 * Como o resto, hoje mora no navegador; a interface é a que o Supabase vai
 * implementar depois.
 */

const ITEMS_KEY = 'acaiteria-mr:inventory'
const MOVES_KEY = 'acaiteria-mr:inventory-moves'
const CHANGED_EVENT = 'acaiteria-mr:inventory-changed'

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

const read = <T,>(key: string): T[] => {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

const write = (key: string, value: unknown): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Sem storage disponível: vale só para a sessão atual.
  }
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT))
}

export const listItems = (): readonly InventoryItem[] =>
  read<InventoryItem>(ITEMS_KEY)
    .slice()
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))

export const listMovements = (): readonly Movement[] =>
  read<Movement>(MOVES_KEY)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

const slug = (name: string): string =>
  name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export type NewInventoryItem = Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>

export const addItem = (draft: NewInventoryItem): InventoryItem => {
  const items = read<InventoryItem>(ITEMS_KEY)
  const now = new Date().toISOString()

  const base = `insumo-${slug(draft.name) || 'item'}`
  let id = base
  let suffix = 2
  while (items.some((item) => item.id === id)) {
    id = `${base}-${suffix}`
    suffix += 1
  }

  const item: InventoryItem = { ...draft, id, createdAt: now, updatedAt: now }
  write(ITEMS_KEY, [...items, item])
  return item
}

export const updateItem = (id: string, patch: Partial<NewInventoryItem>): void => {
  write(
    ITEMS_KEY,
    read<InventoryItem>(ITEMS_KEY).map((item) =>
      item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
    ),
  )
}

export const removeItem = (id: string): void => {
  write(
    ITEMS_KEY,
    read<InventoryItem>(ITEMS_KEY).filter((item) => item.id !== id),
  )
  write(
    MOVES_KEY,
    read<Movement>(MOVES_KEY).filter((move) => move.itemId !== id),
  )
}

export interface NewMovement {
  readonly itemId: string
  readonly type: MovementType
  readonly quantity: number
  readonly reason: string
  readonly cost?: number
}

/**
 * Registra a movimentação e já ajusta o saldo do insumo. Saída nunca deixa o
 * saldo negativo: quem chama valida antes, e aqui o piso é zero por garantia.
 */
export const registerMovement = (draft: NewMovement): Movement | null => {
  const items = read<InventoryItem>(ITEMS_KEY)
  const item = items.find((current) => current.id === draft.itemId)
  if (!item) return null

  const delta = draft.type === 'entrada' ? draft.quantity : -draft.quantity
  const quantity = Math.max(0, Number((item.quantity + delta).toFixed(3)))
  const createdAt = new Date().toISOString()

  const movement: Movement = {
    id: `${createdAt}-${item.id}`,
    itemId: item.id,
    itemName: item.name,
    type: draft.type,
    quantity: draft.quantity,
    unit: item.unit,
    reason: draft.reason,
    ...(draft.cost !== undefined && { cost: draft.cost }),
    createdAt,
  }

  write(
    ITEMS_KEY,
    items.map((current) =>
      current.id === item.id ? { ...current, quantity, updatedAt: createdAt } : current,
    ),
  )
  write(MOVES_KEY, [movement, ...read<Movement>(MOVES_KEY)])

  return movement
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

/** Avisa quando o estoque mudar, inclusive em outra aba do navegador. */
export const subscribeToInventory = (listener: () => void): (() => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key === ITEMS_KEY || event.key === MOVES_KEY) listener()
  }

  window.addEventListener(CHANGED_EVENT, listener)
  window.addEventListener('storage', onStorage)

  return () => {
    window.removeEventListener(CHANGED_EVENT, listener)
    window.removeEventListener('storage', onStorage)
  }
}
