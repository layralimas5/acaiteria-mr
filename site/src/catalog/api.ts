import { supabase } from '../lib/supabase'
import type { AcaiBase, Catalog, CupSize, ProductKind, Topping, ToppingCategory } from './types'

/**
 * Leitura e escrita do cardápio no Supabase.
 *
 * Esta é a única porta de entrada dos dados do cardápio: nenhuma tela conhece
 * nome de tabela ou coluna. O site lê (permitido para qualquer visitante) e o
 * painel escreve (exige login, garantido pelo RLS no banco).
 */

// ---------------------------------------------------------------------------
// Formato das linhas no banco, em snake_case. Só este arquivo enxerga isso.
// ---------------------------------------------------------------------------

interface ProductRow {
  id: string
  name: string
  description: string
  emoji: string
  base_step_title: string
  base_step_subtitle: string
  base_label: string
  available: boolean
  sort_order: number
}

interface SizeRow {
  id: string
  product_id: string
  name: string
  volume: string
  base_price: number
  image: string | null
  highlight: string | null
  available: boolean
  sort_order: number
}

interface BaseRow {
  id: string
  product_id: string
  name: string
  description: string
  extra_price: number
  available: boolean
  sort_order: number
}

interface CategoryRow {
  id: string
  title: string
  subtitle: string
  free_count: number
  max_count: number | null
  sort_order: number
}

interface ToppingRow {
  id: string
  category_id: string
  name: string
  price: number
  emoji: string
  image: string | null
  available: boolean
  sort_order: number
}

// ---------------------------------------------------------------------------
// Conversão banco -> tela
// ---------------------------------------------------------------------------

const toSize = (row: SizeRow): CupSize => ({
  id: row.id,
  productId: row.product_id,
  name: row.name,
  volume: row.volume,
  basePrice: Number(row.base_price),
  ...(row.image ? { image: row.image } : {}),
  ...(row.highlight ? { highlight: row.highlight } : {}),
  available: row.available,
  sortOrder: row.sort_order,
})

const toBase = (row: BaseRow): AcaiBase => ({
  id: row.id,
  productId: row.product_id,
  name: row.name,
  description: row.description,
  extraPrice: Number(row.extra_price),
  available: row.available,
  sortOrder: row.sort_order,
})

const toCategory = (row: CategoryRow): ToppingCategory => ({
  id: row.id,
  title: row.title,
  subtitle: row.subtitle,
  rule: { free: row.free_count, max: row.max_count },
  sortOrder: row.sort_order,
})

const toTopping = (row: ToppingRow): Topping => ({
  id: row.id,
  categoryId: row.category_id,
  name: row.name,
  price: Number(row.price),
  emoji: row.emoji,
  ...(row.image ? { image: row.image } : {}),
  available: row.available,
  sortOrder: row.sort_order,
})

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------

/**
 * Cardápio inteiro numa tacada.
 *
 * São cinco tabelas pequenas e o site precisa das cinco para desenhar o
 * montador, então buscar tudo junto sai mais barato do que buscar por etapa.
 */
export const fetchCatalog = async (): Promise<Catalog> => {
  const [products, sizes, bases, categories, toppings] = await Promise.all([
    supabase.from('products').select('*').order('sort_order'),
    supabase.from('product_sizes').select('*').order('sort_order'),
    supabase.from('product_bases').select('*').order('sort_order'),
    supabase.from('topping_categories').select('*').order('sort_order'),
    supabase.from('toppings').select('*').order('sort_order'),
  ])

  const failure = [products, sizes, bases, categories, toppings].find((result) => result.error)
  if (failure?.error) throw failure.error

  const sizeRows = (sizes.data ?? []) as SizeRow[]
  const baseRows = (bases.data ?? []) as BaseRow[]

  const productList: readonly ProductKind[] = ((products.data ?? []) as ProductRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    emoji: row.emoji,
    baseStepTitle: row.base_step_title,
    baseStepSubtitle: row.base_step_subtitle,
    baseLabel: row.base_label,
    available: row.available,
    sortOrder: row.sort_order,
    sizes: sizeRows.filter((size) => size.product_id === row.id).map(toSize),
    bases: baseRows.filter((base) => base.product_id === row.id).map(toBase),
  }))

  const categoryList = ((categories.data ?? []) as CategoryRow[]).map(toCategory)
  const toppingList = ((toppings.data ?? []) as ToppingRow[]).map(toTopping)

  return {
    products: productList,
    categories: categoryList,
    toppings: toppingList,
    toppingsByCategory: (categoryId) =>
      toppingList.filter((topping) => topping.categoryId === categoryId),
    rules: Object.fromEntries(categoryList.map((category) => [category.id, category.rule])),
  }
}

// ---------------------------------------------------------------------------
// Escrita (painel)
// ---------------------------------------------------------------------------

const fail = (error: unknown): never => {
  throw error
}

/** Última posição de uma lista, para o item novo entrar no fim. */
const nextOrder = (items: readonly { readonly sortOrder: number }[]): number =>
  items.reduce((highest, item) => Math.max(highest, item.sortOrder), -1) + 1

export interface ProductDraft {
  readonly name: string
  readonly description: string
  readonly emoji: string
  readonly baseStepTitle: string
  readonly baseStepSubtitle: string
  readonly baseLabel: string
}

export const createProduct = async (
  draft: ProductDraft,
  existing: readonly ProductKind[],
): Promise<void> => {
  const { error } = await supabase.from('products').insert({
    name: draft.name.trim(),
    description: draft.description.trim(),
    emoji: draft.emoji.trim(),
    base_step_title: draft.baseStepTitle.trim(),
    base_step_subtitle: draft.baseStepSubtitle.trim(),
    base_label: draft.baseLabel.trim(),
    sort_order: nextOrder(existing),
  })
  if (error) fail(error)
}

export const updateProduct = async (
  id: string,
  patch: Partial<ProductDraft> & { readonly available?: boolean },
): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .update({
      ...(patch.name !== undefined && { name: patch.name.trim() }),
      ...(patch.description !== undefined && { description: patch.description.trim() }),
      ...(patch.emoji !== undefined && { emoji: patch.emoji.trim() }),
      ...(patch.baseStepTitle !== undefined && { base_step_title: patch.baseStepTitle.trim() }),
      ...(patch.baseStepSubtitle !== undefined && {
        base_step_subtitle: patch.baseStepSubtitle.trim(),
      }),
      ...(patch.baseLabel !== undefined && { base_label: patch.baseLabel.trim() }),
      ...(patch.available !== undefined && { available: patch.available }),
    })
    .eq('id', id)
  if (error) fail(error)
}

/** Apaga o produto e, por cascata no banco, os tamanhos e bases dele. */
export const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) fail(error)
}

export interface SizeDraft {
  readonly name: string
  readonly volume: string
  readonly basePrice: number
  readonly image: string
  readonly highlight: string
}

export const createSize = async (
  productId: string,
  draft: SizeDraft,
  existing: readonly CupSize[],
): Promise<void> => {
  const { error } = await supabase.from('product_sizes').insert({
    product_id: productId,
    name: draft.name.trim(),
    volume: draft.volume.trim(),
    base_price: draft.basePrice,
    image: draft.image.trim() || null,
    highlight: draft.highlight.trim() || null,
    sort_order: nextOrder(existing),
  })
  if (error) fail(error)
}

export const updateSize = async (
  id: string,
  patch: Partial<SizeDraft> & { readonly available?: boolean },
): Promise<void> => {
  const { error } = await supabase
    .from('product_sizes')
    .update({
      ...(patch.name !== undefined && { name: patch.name.trim() }),
      ...(patch.volume !== undefined && { volume: patch.volume.trim() }),
      ...(patch.basePrice !== undefined && { base_price: patch.basePrice }),
      ...(patch.image !== undefined && { image: patch.image.trim() || null }),
      ...(patch.highlight !== undefined && { highlight: patch.highlight.trim() || null }),
      ...(patch.available !== undefined && { available: patch.available }),
    })
    .eq('id', id)
  if (error) fail(error)
}

export const deleteSize = async (id: string): Promise<void> => {
  const { error } = await supabase.from('product_sizes').delete().eq('id', id)
  if (error) fail(error)
}

export interface BaseDraft {
  readonly name: string
  readonly description: string
  readonly extraPrice: number
}

export const createBase = async (
  productId: string,
  draft: BaseDraft,
  existing: readonly AcaiBase[],
): Promise<void> => {
  const { error } = await supabase.from('product_bases').insert({
    product_id: productId,
    name: draft.name.trim(),
    description: draft.description.trim(),
    extra_price: draft.extraPrice,
    sort_order: nextOrder(existing),
  })
  if (error) fail(error)
}

export const updateBase = async (
  id: string,
  patch: Partial<BaseDraft> & { readonly available?: boolean },
): Promise<void> => {
  const { error } = await supabase
    .from('product_bases')
    .update({
      ...(patch.name !== undefined && { name: patch.name.trim() }),
      ...(patch.description !== undefined && { description: patch.description.trim() }),
      ...(patch.extraPrice !== undefined && { extra_price: patch.extraPrice }),
      ...(patch.available !== undefined && { available: patch.available }),
    })
    .eq('id', id)
  if (error) fail(error)
}

export const deleteBase = async (id: string): Promise<void> => {
  const { error } = await supabase.from('product_bases').delete().eq('id', id)
  if (error) fail(error)
}

export interface CategoryDraft {
  readonly title: string
  readonly subtitle: string
  readonly free: number
  readonly max: number | null
}

export const createCategory = async (
  draft: CategoryDraft,
  existing: readonly ToppingCategory[],
): Promise<void> => {
  const { error } = await supabase.from('topping_categories').insert({
    title: draft.title.trim(),
    subtitle: draft.subtitle.trim(),
    free_count: draft.free,
    max_count: draft.max,
    sort_order: nextOrder(existing),
  })
  if (error) fail(error)
}

export const updateCategory = async (id: string, patch: Partial<CategoryDraft>): Promise<void> => {
  const { error } = await supabase
    .from('topping_categories')
    .update({
      ...(patch.title !== undefined && { title: patch.title.trim() }),
      ...(patch.subtitle !== undefined && { subtitle: patch.subtitle.trim() }),
      ...(patch.free !== undefined && { free_count: patch.free }),
      ...(patch.max !== undefined && { max_count: patch.max }),
    })
    .eq('id', id)
  if (error) fail(error)
}

/** Apaga a categoria e, por cascata no banco, os complementos dela. */
export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase.from('topping_categories').delete().eq('id', id)
  if (error) fail(error)
}

export interface ToppingDraft {
  readonly name: string
  readonly price: number
  readonly emoji: string
  readonly image: string
}

export const createTopping = async (
  categoryId: string,
  draft: ToppingDraft,
  existing: readonly Topping[],
): Promise<void> => {
  const { error } = await supabase.from('toppings').insert({
    category_id: categoryId,
    name: draft.name.trim(),
    price: draft.price,
    emoji: draft.emoji.trim() || '✨',
    image: draft.image.trim() || null,
    sort_order: nextOrder(existing),
  })
  if (error) fail(error)
}

export const updateTopping = async (
  id: string,
  patch: Partial<ToppingDraft> & { readonly available?: boolean; readonly categoryId?: string },
): Promise<void> => {
  const { error } = await supabase
    .from('toppings')
    .update({
      ...(patch.name !== undefined && { name: patch.name.trim() }),
      ...(patch.price !== undefined && { price: patch.price }),
      ...(patch.emoji !== undefined && { emoji: patch.emoji.trim() || '✨' }),
      ...(patch.image !== undefined && { image: patch.image.trim() || null }),
      ...(patch.available !== undefined && { available: patch.available }),
      ...(patch.categoryId !== undefined && { category_id: patch.categoryId }),
    })
    .eq('id', id)
  if (error) fail(error)
}

export const deleteTopping = async (id: string): Promise<void> => {
  const { error } = await supabase.from('toppings').delete().eq('id', id)
  if (error) fail(error)
}

/**
 * Troca a posição de dois itens na lista.
 *
 * A loja reordena com as setas na tela, e o que muda é só o `sort_order` das
 * duas linhas envolvidas.
 */
export const swapOrder = async (
  table: 'products' | 'product_sizes' | 'product_bases' | 'topping_categories' | 'toppings',
  a: { readonly id: string; readonly sortOrder: number },
  b: { readonly id: string; readonly sortOrder: number },
): Promise<void> => {
  const [first, second] = await Promise.all([
    supabase.from(table).update({ sort_order: b.sortOrder }).eq('id', a.id),
    supabase.from(table).update({ sort_order: a.sortOrder }).eq('id', b.id),
  ])
  if (first.error) fail(first.error)
  if (second.error) fail(second.error)
}
