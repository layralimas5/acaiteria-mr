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
 * Quem decide se um complemento custa alguma coisa é o preço dele no cardápio,
 * não a ordem em que o cliente clicou. Item cadastrado com preço zero é
 * cortesia; item com preço sempre entra como adicional.
 *
 * A cota gratuita (`free`) e o teto (`max`) continuam por categoria: a cota
 * anuncia quantos itens de cortesia acompanham o copo e o teto limita a
 * escolha. É a regra que a loja explica no balcão e a que o painel controla.
 *
 * As categorias não são fixas: vêm do cardápio que a loja cadastrou, então
 * toda função aqui recebe a lista em vez de importar uma constante.
 */

export interface BuildSelection {
  /** O produto escolhido: define quais tamanhos e bases aparecem. */
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

/** Cortesia é o que a loja cadastrou sem preço. Vale para qualquer categoria. */
export const isFreeTopping = (topping: Topping): boolean => topping.price === 0

/** Complementos escolhidos de uma categoria, preservando a ordem de escolha. */
const inCategory = (toppings: readonly Topping[], categoryId: string): readonly Topping[] =>
  toppings.filter((topping) => topping.categoryId === categoryId)

/**
 * Complementos de uma categoria que realmente entram na conta: os que a loja
 * cadastrou com preço.
 *
 * Item com preço nunca ocupa vaga na cota grátis. Antes a cota valia por ordem
 * de escolha, então clicar na Nutella antes da Avelã fazia um creme de R$ 3,00
 * sair de graça e dois clientes pagavam valores diferentes pelo mesmo copo.
 * Para dar um item de cortesia, é preço zero no painel.
 */
const chargedIn = (
  toppings: readonly Topping[],
  category: ToppingCategory,
): readonly Topping[] =>
  inCategory(toppings, category.id).filter((topping) => topping.price > 0)

/** Complementos de cortesia escolhidos: os de preço zero. */
const freeIn = (
  toppings: readonly Topping[],
  category: ToppingCategory,
): readonly Topping[] =>
  inCategory(toppings, category.id).filter((topping) => topping.price === 0)

/** Cota de uma categoria que o cardápio não conhece mais: nada grátis, sem teto. */
const noRule: ToppingRule = { free: 0, max: null }

/** Produto que não leva complemento não tem cota grátis nem adicional. */
export const acceptsToppings = (selection: BuildSelection): boolean =>
  selection.product?.acceptsToppings ?? true

export const priceBuild = (
  selection: BuildSelection,
  categories: readonly ToppingCategory[],
): BuildPricing => {
  const basePrice = (selection.size?.basePrice ?? 0) + (selection.base?.extraPrice ?? 0)

  if (!acceptsToppings(selection)) {
    return {
      basePrice,
      freeLimit: 0,
      freeUsed: 0,
      paidToppings: [],
      additionalPrice: 0,
      subtotal: basePrice,
      totalPrice: basePrice,
      byCategory: {},
    }
  }

  const paidByCategory = new Map(
    categories.map((category) => [category.id, chargedIn(selection.toppings, category)]),
  )

  const usages = categories.map((category): CategoryUsage => {
    const rule = category.rule
    const chosen = inCategory(selection.toppings, category.id).length

    return {
      categoryId: category.id,
      chosen,
      free: rule.free,
      max: rule.max,
      freeUsed: Math.min(freeIn(selection.toppings, category).length, rule.free),
      paid: paidByCategory.get(category.id)?.length ?? 0,
      full: rule.max !== null && chosen >= rule.max,
    }
  })

  const paidToppings = categories.flatMap((category) => paidByCategory.get(category.id) ?? [])
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

  const extra = pricing.paidToppings.length
  if (extra > 0) {
    const free = selection.toppings.length - extra
    return `${free} grátis + ${extra} ${extra === 1 ? 'adicional' : 'adicionais'}`
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
