/**
 * Cardápio da loja.
 *
 * Nada aqui é fixo no código: produtos, tamanhos, bases, categorias e
 * complementos são cadastrados pela loja no painel e vivem no Supabase. Este
 * arquivo descreve só o formato que as telas enxergam.
 *
 * Os ids são uuid do banco, então são `string` sem união fechada: a loja pode
 * criar quantos produtos e categorias quiser.
 */

/** Quanto sai de graça numa categoria e qual o teto de escolha. */
export interface ToppingRule {
  /** Já incluso no preço do copo. A partir daí cada item soma o próprio preço. */
  readonly free: number
  /** Limite de quantos cabem no copo. `null` quando não há limite. */
  readonly max: number | null
}

export interface CupSize {
  readonly id: string
  readonly productId: string
  readonly name: string
  readonly volume: string
  readonly basePrice: number
  readonly image?: string
  /** Etiqueta opcional no card, tipo "Mais pedido". */
  readonly highlight?: string
  readonly available: boolean
  readonly sortOrder: number
}

export interface AcaiBase {
  readonly id: string
  readonly productId: string
  readonly name: string
  readonly description: string
  /** Acréscimo sobre o preço do tamanho. Zero na maioria das opções. */
  readonly extraPrice: number
  readonly available: boolean
  readonly sortOrder: number
}

export interface ProductKind {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly emoji: string
  /** Título da etapa de base, que muda de nome conforme o produto. */
  readonly baseStepTitle: string
  readonly baseStepSubtitle: string
  /** Como a base aparece no resumo do pedido. */
  readonly baseLabel: string
  readonly available: boolean
  readonly sortOrder: number
  readonly sizes: readonly CupSize[]
  readonly bases: readonly AcaiBase[]
}

export interface ToppingCategory {
  readonly id: string
  readonly title: string
  readonly subtitle: string
  readonly rule: ToppingRule
  readonly sortOrder: number
}

export interface Topping {
  readonly id: string
  readonly categoryId: string
  readonly name: string
  readonly price: number
  readonly image?: string
  /** Usado enquanto não há foto do complemento. */
  readonly emoji: string
  readonly available: boolean
  readonly sortOrder: number
}

export interface Catalog {
  readonly products: readonly ProductKind[]
  readonly categories: readonly ToppingCategory[]
  readonly toppings: readonly Topping[]
  readonly toppingsByCategory: (categoryId: string) => readonly Topping[]
  /** Cota grátis e teto de cada categoria, pelo id da categoria. */
  readonly rules: Readonly<Record<string, ToppingRule>>
}

export const emptyCatalog: Catalog = {
  products: [],
  categories: [],
  toppings: [],
  toppingsByCategory: () => [],
  rules: {},
}

/** Soma das cotas grátis de todas as categorias. É o que o site anuncia. */
export const totalFreeToppings = (categories: readonly ToppingCategory[]): number =>
  categories.reduce((total, category) => total + category.rule.free, 0)

/** true quando a loja ainda não cadastrou nada que dê para vender. */
export const isCatalogEmpty = (catalog: Catalog): boolean =>
  catalog.products.every((product) => product.sizes.length === 0)
