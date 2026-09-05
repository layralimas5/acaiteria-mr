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
  /** Foto do produto no card de escolha. Sem ela, o card mostra o emoji. */
  readonly image?: string
  /** Título da etapa de base, que muda de nome conforme o produto. */
  readonly baseStepTitle: string
  readonly baseStepSubtitle: string
  /** Como a base aparece no resumo do pedido. */
  readonly baseLabel: string
  /**
   * Se o produto leva complemento.
   *
   * A cota grátis é da categoria e valia para tudo que a loja vendesse. Só que
   * o sundae não é o copo grande: dar nele os mesmos complementos de cortesia
   * entrega o produto no prejuízo. Desligado, o montador pula a etapa.
   */
  readonly acceptsToppings: boolean
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

/**
 * Os produtos do cardápio numa frase: "Açaí ou Sundae".
 *
 * O montador anunciava "açaí ou sorvete" em texto fixo, escrito quando a loja
 * só vendia isso. Cadastrar um Sundae no painel mudava a etapa 1 e não mudava
 * a frase que a apresenta. Quem manda é o cardápio: entra produto, entra na
 * frase; sai produto, sai da frase.
 */
export const productChoices = (
  products: readonly ProductKind[],
  conjunction: 'ou' | 'e' = 'ou',
): string => {
  const names = products.map((product) => product.name.trim()).filter((name) => name !== '')
  if (names.length <= 1) return names[0] ?? ''

  const last = names[names.length - 1] as string
  return `${names.slice(0, -1).join(', ')} ${conjunction} ${last}`
}

/**
 * Como o tamanho se apresenta nas telas do cliente.
 *
 * O açaí se identifica pela medida ("500ml") e é ela que o cliente procura.
 * Mas nem todo produto se mede assim: o sundae vem em taça única, sem
 * mililitro nenhum, e aí quem identifica é o nome. Sem isso, o resumo do
 * pedido mostrava "Tamanho: a escolher" com o tamanho já escolhido.
 */
export const sizeLabel = (size: CupSize): string => size.volume.trim() || size.name

/** Soma das cotas grátis de todas as categorias. É o que o site anuncia. */
export const totalFreeToppings = (categories: readonly ToppingCategory[]): number =>
  categories.reduce((total, category) => total + category.rule.free, 0)

/** true quando a loja ainda não cadastrou nada que dê para vender. */
export const isCatalogEmpty = (catalog: Catalog): boolean =>
  catalog.products.every((product) => product.sizes.length === 0)
