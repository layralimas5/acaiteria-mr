import type {
  AcaiBase,
  Catalog,
  CupSize,
  ProductKind,
  Topping,
  ToppingCategory,
  ToppingRule,
} from '../catalog/types'

/**
 * Regras de preço da montagem.
 *
 * A cota gratuita é por categoria: cada uma tem quantos itens já vêm inclusos
 * (`free`) e, quando faz sentido, um teto de escolha (`max`). Dentro de uma
 * categoria vale a ordem de escolha: os primeiros entram na cota, os
 * seguintes são cobrados. É a regra que a loja explica no balcão e a que o
 * painel controla no cardápio.
 *
 * As categorias não são fixas: vêm do cardápio que a loja cadastrou, então
 * toda função aqui recebe a lista em vez de importar uma constante.
 */

export interface BuildSelection {
  /** Açaí ou sorvete: define quais tamanhos e bases aparecem. */
  readonly product: ProductKind | null
  readonly size: CupSize | null
  readonly base: AcaiBase | null
  /** Na ordem em que foram escolhidos. */
  readonly toppings: readonly Topping[]
}

export interface CategoryUsage {
  readonly categoryId: string
  readonly chosen: number
  readonly free: number
  readonly max: number | null
  /** Quantos da cota grátis já foram usados. */
  readonly freeUsed: number
  /** Quantos passaram da cota e entram como adicional. */
  readonly paid: number
  /** true quando o teto da categoria foi atingido. */
  readonly full: boolean
}

export interface BuildPricing {
  readonly basePrice: number
  /** Soma das cotas grátis de todas as categorias. Serve para exibição. */
  readonly freeLimit: number
  readonly freeUsed: number
  readonly paidToppings: readonly Topping[]
  readonly additionalPrice: number
  readonly subtotal: number
  readonly totalPrice: number
  readonly byCategory: Readonly<Record<string, CategoryUsage>>
}

export const emptySelection: BuildSelection = { product: null, size: null, base: null, toppings: [] }

/** Complementos escolhidos de uma categoria, preservando a ordem de escolha. */
const inCategory = (toppings: readonly Topping[], categoryId: string): readonly Topping[] =>
  toppings.filter((topping) => topping.categoryId === categoryId)

/** Cota de uma categoria que o cardápio não conhece mais: nada grátis, sem teto. */
const noRule: ToppingRule = { free: 0, max: null }

export const priceBuild = (
  selection: BuildSelection,
  categories: readonly ToppingCategory[],
): BuildPricing => {
  const basePrice = (selection.size?.basePrice ?? 0) + (selection.base?.extraPrice ?? 0)

  const usages = categories.map((category): CategoryUsage => {
    const rule = category.rule
    const chosen = inCategory(selection.toppings, category.id).length
    const freeUsed = Math.min(chosen, rule.free)

    return {
      categoryId: category.id,
      chosen,
      free: rule.free,
      max: rule.max,
      freeUsed,
      paid: Math.max(0, chosen - rule.free),
      full: rule.max !== null && chosen >= rule.max,
    }
  })

  const paidToppings = categories.flatMap((category) =>
    inCategory(selection.toppings, category.id).slice(category.rule.free),
  )
  const additionalPrice = paidToppings.reduce((total, topping) => total + topping.price, 0)

  return {
    basePrice,
    freeLimit: usages.reduce((total, usage) => total + usage.free, 0),
    freeUsed: usages.reduce((total, usage) => total + usage.freeUsed, 0),
    paidToppings,
    additionalPrice,
    subtotal: basePrice,
    totalPrice: basePrice + additionalPrice,
    byCategory: Object.fromEntries(usages.map((usage) => [usage.categoryId, usage])),
  }
}

/** false quando a categoria já bateu o teto e esse complemento ainda não entrou. */
export const canAddTopping = (
  selection: BuildSelection,
  topping: Topping,
  rules: Catalog['rules'],
): boolean => {
  if (selection.toppings.some((item) => item.id === topping.id)) return true

  const max = (rules[topping.categoryId] ?? noRule).max
  if (max === null) return true

  return inCategory(selection.toppings, topping.categoryId).length < max
}

/** Resumo da cota de uma categoria, como aparece na tela. */
export const categoryQuotaLabel = (usage: CategoryUsage): string => {
  const parts: string[] = []

  if (usage.free > 0) {
    parts.push(usage.paid > 0 ? `${usage.free} grátis` : `${usage.freeUsed} de ${usage.free} grátis`)
  }
  if (usage.paid > 0) {
    parts.push(`${usage.paid} ${usage.paid === 1 ? 'adicional' : 'adicionais'}`)
  }
  if (usage.max !== null) {
    parts.push(`máx. ${usage.max}`)
  }

  return parts.join(' · ')
}

/** Texto do contador de complementos, como aparece na tela. */
export const toppingsLabel = (selection: BuildSelection, pricing: BuildPricing): string => {
  if (!selection.size) return 'Escolha o tamanho para liberar os complementos'

  const extra = selection.toppings.length - pricing.freeUsed
  if (extra > 0) {
    return `${pricing.freeUsed} grátis + ${extra} ${extra === 1 ? 'adicional' : 'adicionais'}`
  }

  return `Complementos escolhidos: ${selection.toppings.length} de ${pricing.freeLimit} grátis`
}

/** O que ainda falta para poder mandar o pedido. */
export const missingSteps = (selection: BuildSelection): readonly string[] => {
  const missing: string[] = []
  if (!selection.product) missing.push('escolha o produto')
  if (!selection.size) missing.push('escolha o tamanho')
  if (!selection.base) missing.push(`escolha ${(selection.product?.baseLabel ?? 'a base').toLowerCase()}`)
  return missing
}

export const isComplete = (selection: BuildSelection): boolean => missingSteps(selection).length === 0

/** Alterna um complemento preservando a ordem de escolha. */
export const toggleTopping = (
  toppings: readonly Topping[],
  topping: Topping,
): readonly Topping[] => {
  const exists = toppings.some((item) => item.id === topping.id)
  return exists ? toppings.filter((item) => item.id !== topping.id) : [...toppings, topping]
}
