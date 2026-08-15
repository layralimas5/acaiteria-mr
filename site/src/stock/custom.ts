import type { ProductKindId, ToppingCategoryId } from '../data/builder'

/**
 * Itens criados pela loja no painel.
 *
 * O cardápio publicado vive em `data/builder.ts` e só muda com deploy. O que a
 * loja inventa no dia a dia (um complemento novo, um tamanho promocional) entra
 * aqui e aparece no site na hora, sem republicar.
 */

const STORAGE_KEY = 'acaiteria-mr:custom-items'
const CHANGED_EVENT = 'acaiteria-mr:custom-items-changed'

export type CustomKind = 'topping' | 'size' | 'base'

export interface CustomItem {
  readonly id: string
  readonly kind: CustomKind
  readonly name: string
  /** Complemento: preço do adicional. Tamanho: preço cheio. Base: acréscimo. */
  readonly price: number
  /** Se aparece no site. A loja liga e desliga sem apagar o item. */
  readonly visible: boolean
  /** Tamanho e base pertencem a um produto. */
  readonly productId?: ProductKindId
  /** Complemento pertence a uma categoria. */
  readonly categoryId?: ToppingCategoryId
  readonly emoji?: string
  readonly volume?: string
  readonly description?: string
  readonly freeToppings?: number
  readonly createdAt: string
}

export const kindLabels: Readonly<Record<CustomKind, string>> = {
  topping: 'Complemento',
  size: 'Tamanho',
  base: 'Base ou sabor',
}

export const readCustomItems = (): readonly CustomItem[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as CustomItem[]) : []
  } catch {
    return []
  }
}

const write = (items: readonly CustomItem[]): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Sem storage disponível: vale só para a sessão atual.
  }
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT))
}

/** Id estável e legível, no mesmo formato dos ids do cardápio. */
const buildId = (kind: CustomKind, name: string, existing: readonly CustomItem[]): string => {
  const slug = name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const base = `custom-${kind}-${slug || 'item'}`
  if (!existing.some((item) => item.id === base)) return base

  let suffix = 2
  while (existing.some((item) => item.id === `${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}

export type NewCustomItem = Omit<CustomItem, 'id' | 'createdAt'>

export const addCustomItem = (draft: NewCustomItem): CustomItem => {
  const items = readCustomItems()
  const item: CustomItem = {
    ...draft,
    id: buildId(draft.kind, draft.name, items),
    createdAt: new Date().toISOString(),
  }
  write([...items, item])
  return item
}

export const setCustomItemVisible = (id: string, visible: boolean): void => {
  write(readCustomItems().map((item) => (item.id === id ? { ...item, visible } : item)))
}

export const removeCustomItem = (id: string): void => {
  write(readCustomItems().filter((item) => item.id !== id))
}

/** Avisa quando os itens mudarem, inclusive em outra aba do navegador. */
export const subscribeToCustomItems = (listener: () => void): (() => void) => {
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
