import type { AcaiBase, CupSize, ProductKind, Topping } from '../data/builder'

/**
 * Regras de preço da montagem.
 *
 * Os complementos gratuitos valem por ordem de escolha: os primeiros que o
 * cliente seleciona entram no limite do tamanho, os seguintes são cobrados.
 * É a regra mais fácil de explicar no balcão e de conferir na tela.
 */

export interface BuildSelection {
  /** Açaí ou sorvete: define quais tamanhos e bases aparecem. */
  readonly product: ProductKind | null
  readonly size: CupSize | null
  readonly base: AcaiBase | null
  /** Na ordem em que foram escolhidos. */
  readonly toppings: readonly Topping[]
}

export interface BuildPricing {
  readonly basePrice: number
  readonly freeLimit: number
  readonly freeUsed: number
  readonly paidToppings: readonly Topping[]
  readonly additionalPrice: number
  readonly subtotal: number
  readonly totalPrice: number
}

export const emptySelection: BuildSelection = { product: null, size: null, base: null, toppings: [] }

export const priceBuild = (selection: BuildSelection): BuildPricing => {
  const basePrice = (selection.size?.basePrice ?? 0) + (selection.base?.extraPrice ?? 0)
  const freeLimit = selection.size?.freeToppings ?? 0

  const freeUsed = Math.min(selection.toppings.length, freeLimit)
  const paidToppings = selection.toppings.slice(freeLimit)
  const additionalPrice = paidToppings.reduce((total, topping) => total + topping.price, 0)

  return {
    basePrice,
    freeLimit,
    freeUsed,
    paidToppings,
    additionalPrice,
    subtotal: basePrice,
    totalPrice: basePrice + additionalPrice,
  }
}

/** Texto do contador de complementos, como aparece na tela. */
export const toppingsLabel = (selection: BuildSelection, pricing: BuildPricing): string => {
  if (!selection.size) return 'Escolha o tamanho para liberar os complementos'

  const extra = selection.toppings.length - pricing.freeLimit
  if (extra > 0) {
    return `${pricing.freeLimit} grátis + ${extra} ${extra === 1 ? 'adicional' : 'adicionais'}`
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
