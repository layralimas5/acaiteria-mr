/**
 * Catálogo do "Monte seu Açaí".
 *
 * Tudo aqui é dado puro e serializável: nenhum preço, limite ou nome vive
 * dentro de componente. Quando existir painel administrativo ou banco, basta
 * trocar estas constantes por uma resposta de API com o mesmo formato.
 */

export interface CupSize {
  readonly id: string
  readonly name: string
  readonly volume: string
  readonly basePrice: number
  /** Quantos complementos saem sem custo nesse tamanho. */
  readonly freeToppings: number
  readonly image?: string
  readonly available: boolean
}

export interface AcaiBase {
  readonly id: string
  readonly name: string
  readonly description: string
  /** Acréscimo sobre o preço do tamanho. Zero na maioria das bases. */
  readonly extraPrice: number
  readonly available: boolean
}

export type ToppingCategoryId = 'frutas' | 'cremes' | 'crocantes' | 'caldas'

export interface Topping {
  readonly id: string
  readonly name: string
  readonly categoryId: ToppingCategoryId
  readonly price: number
  readonly image?: string
  /** Usado enquanto não há foto do complemento. */
  readonly emoji: string
  readonly available: boolean
}

export interface ToppingCategory {
  readonly id: ToppingCategoryId
  readonly title: string
  readonly subtitle: string
}

export const cupSizes: readonly CupSize[] = [
  {
    id: 'copo-300',
    name: 'Copo 300ml',
    volume: '300ml',
    basePrice: 12.9,
    freeToppings: 3,
    image: '/imagem/poto-300ml.webp',
    available: true,
  },
  {
    id: 'copo-500',
    name: 'Copo 500ml',
    volume: '500ml',
    basePrice: 17.9,
    freeToppings: 5,
    image: '/imagem/pote-500ml.webp',
    available: true,
  },
  {
    id: 'copo-700',
    name: 'Copo 700ml',
    volume: '700ml',
    basePrice: 22.9,
    freeToppings: 7,
    image: '/imagem/copo-700ml.webp',
    available: true,
  },
]

export const acaiBases: readonly AcaiBase[] = [
  {
    id: 'tradicional',
    name: 'Açaí tradicional',
    description: 'O clássico, cremoso e adoçado na medida.',
    extraPrice: 0,
    available: true,
  },
  {
    id: 'zero',
    name: 'Açaí zero',
    description: 'Sem açúcar adicionado, mesma cremosidade.',
    extraPrice: 0,
    available: true,
  },
  {
    id: 'cupuacu',
    name: 'Cupuaçu',
    description: 'Mais leve e cítrico, pra quem quer variar.',
    extraPrice: 2,
    available: true,
  },
  {
    id: 'acai-cupuacu',
    name: 'Açaí + Cupuaçu',
    description: 'Meio a meio no mesmo copo.',
    extraPrice: 2,
    available: true,
  },
]

export const toppingCategories: readonly ToppingCategory[] = [
  { id: 'frutas', title: 'Escolha suas frutas', subtitle: 'Fresquinhas, cortadas na hora' },
  { id: 'cremes', title: 'Escolha seus cremes', subtitle: 'Pra dar aquela camada extra' },
  { id: 'crocantes', title: 'Escolha os crocantes', subtitle: 'O barulhinho da colherada' },
  { id: 'caldas', title: 'Escolha as caldas', subtitle: 'Por cima de tudo' },
]

export const toppings: readonly Topping[] = [
  { id: 'morango', name: 'Morango', categoryId: 'frutas', price: 3, emoji: '🍓', available: true },
  { id: 'banana', name: 'Banana', categoryId: 'frutas', price: 2, emoji: '🍌', available: true },
  { id: 'kiwi', name: 'Kiwi', categoryId: 'frutas', price: 3.5, emoji: '🥝', available: true },
  { id: 'uva', name: 'Uva', categoryId: 'frutas', price: 3, emoji: '🍇', available: true },

  { id: 'creme-ninho', name: 'Creme de Ninho', categoryId: 'cremes', price: 4, emoji: '🥛', available: true },
  { id: 'nutella', name: 'Nutella', categoryId: 'cremes', price: 5, emoji: '🍫', available: true },
  { id: 'doce-de-leite', name: 'Doce de leite', categoryId: 'cremes', price: 3.5, emoji: '🍯', available: true },
  { id: 'creme-ovomaltine', name: 'Creme de Ovomaltine', categoryId: 'cremes', price: 4.5, emoji: '🥣', available: true },

  { id: 'granola', name: 'Granola', categoryId: 'crocantes', price: 2, emoji: '🌾', available: true },
  { id: 'pacoca', name: 'Paçoca', categoryId: 'crocantes', price: 2, emoji: '🥜', available: true },
  { id: 'ovomaltine', name: 'Ovomaltine', categoryId: 'crocantes', price: 3, emoji: '🍪', available: true },
  { id: 'confete', name: 'Confete', categoryId: 'crocantes', price: 2.5, emoji: '🍬', available: true },

  { id: 'calda-chocolate', name: 'Chocolate', categoryId: 'caldas', price: 2, emoji: '🍫', available: true },
  { id: 'leite-condensado', name: 'Leite condensado', categoryId: 'caldas', price: 2, emoji: '🥛', available: true },
  { id: 'calda-morango', name: 'Morango', categoryId: 'caldas', price: 2, emoji: '🍓', available: true },
  { id: 'caramelo', name: 'Caramelo', categoryId: 'caldas', price: 2.5, emoji: '🍮', available: true },
]

export const toppingsByCategory = (categoryId: ToppingCategoryId): readonly Topping[] =>
  toppings.filter((topping) => topping.categoryId === categoryId)
