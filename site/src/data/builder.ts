/**
 * Catálogo do montador.
 *
 * A loja vende açaí e sorvete, então o catálogo é organizado por produto:
 * cada um tem os próprios tamanhos e as próprias bases (no sorvete, sabores).
 * Os complementos são compartilhados pelos dois.
 *
 * Tudo aqui é dado puro e serializável: nenhum preço, limite ou nome vive
 * dentro de componente. Quando existir painel administrativo ou banco, basta
 * trocar estas constantes por uma resposta de API com o mesmo formato.
 */

/** Complementos que saem sem custo em qualquer tamanho. */
export const FREE_TOPPINGS = 3

export interface CupSize {
  readonly id: string
  readonly name: string
  readonly volume: string
  readonly basePrice: number
  /** Quantos complementos saem sem custo nesse tamanho. */
  readonly freeToppings: number
  readonly image?: string
  /** Etiqueta opcional no card, tipo "Mais pedido". */
  readonly highlight?: string
  readonly available: boolean
}

export interface AcaiBase {
  readonly id: string
  readonly name: string
  readonly description: string
  /** Acréscimo sobre o preço do tamanho. Zero na maioria das opções. */
  readonly extraPrice: number
  readonly available: boolean
}

export type ProductKindId = 'acai' | 'sorvete'

export interface ProductKind {
  readonly id: ProductKindId
  readonly name: string
  readonly description: string
  readonly emoji: string
  /** Título da etapa de base, que muda de nome conforme o produto. */
  readonly baseStepTitle: string
  readonly baseStepSubtitle: string
  /** Como a base aparece no resumo do pedido. */
  readonly baseLabel: string
  readonly sizes: readonly CupSize[]
  readonly bases: readonly AcaiBase[]
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

const acaiSizes: readonly CupSize[] = [
  {
    id: 'copo-300',
    name: 'Açaí 300ml',
    volume: '300ml',
    basePrice: 12.9,
    freeToppings: FREE_TOPPINGS,
    image: '/imagem/poto-300ml.webp',
    available: true,
  },
  {
    id: 'copo-500',
    name: 'Açaí 500ml',
    volume: '500ml',
    basePrice: 17.9,
    freeToppings: FREE_TOPPINGS,
    image: '/imagem/pote-500ml.webp',
    highlight: 'Mais pedido',
    available: true,
  },
  {
    id: 'copo-700',
    name: 'Açaí 700ml',
    volume: '700ml',
    basePrice: 22.9,
    freeToppings: FREE_TOPPINGS,
    image: '/imagem/copo-700ml.webp',
    available: true,
  },
]

const acaiBases: readonly AcaiBase[] = [
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

// TODO cliente: confirmar tamanhos, preços e sabores do sorvete.
const sorveteSizes: readonly CupSize[] = [
  {
    id: 'sorvete-1-bola',
    name: 'Sorvete 1 bola',
    volume: '1 bola',
    basePrice: 8.9,
    freeToppings: FREE_TOPPINGS,
    available: true,
  },
  {
    id: 'sorvete-2-bolas',
    name: 'Sorvete 2 bolas',
    volume: '2 bolas',
    basePrice: 13.9,
    freeToppings: FREE_TOPPINGS,
    available: true,
  },
  {
    id: 'sorvete-pote-500',
    name: 'Sorvete pote 500ml',
    volume: 'Pote 500ml',
    basePrice: 24.9,
    freeToppings: FREE_TOPPINGS,
    available: true,
  },
]

const sorveteFlavors: readonly AcaiBase[] = [
  { id: 'chocolate', name: 'Chocolate', description: 'O mais pedido da casa.', extraPrice: 0, available: true },
  { id: 'morango', name: 'Morango', description: 'Feito com fruta.', extraPrice: 0, available: true },
  { id: 'creme', name: 'Creme', description: 'Clássico, combina com tudo.', extraPrice: 0, available: true },
  { id: 'flocos', name: 'Flocos', description: 'Creme com raspas de chocolate.', extraPrice: 0, available: true },
  { id: 'napolitano', name: 'Napolitano', description: 'Chocolate, morango e creme.', extraPrice: 1, available: true },
]

export const productKinds: readonly ProductKind[] = [
  {
    id: 'acai',
    name: 'Açaí',
    description: 'Cremoso, batido na hora, montado do seu jeito.',
    emoji: '🍇',
    baseStepTitle: 'Escolha sua base',
    baseStepSubtitle: 'Uma base por copo.',
    baseLabel: 'Base',
    sizes: acaiSizes,
    bases: acaiBases,
    available: true,
  },
  {
    id: 'sorvete',
    name: 'Sorvete',
    description: 'Bola, casquinha ou pote, com os mesmos complementos.',
    emoji: '🍦',
    baseStepTitle: 'Escolha o sabor',
    baseStepSubtitle: 'Um sabor por pedido.',
    baseLabel: 'Sabor',
    sizes: sorveteSizes,
    bases: sorveteFlavors,
    available: true,
  },
]

export const toppingCategories: readonly ToppingCategory[] = [
  { id: 'frutas', title: 'Frutas', subtitle: 'Fresquinhas, cortadas na hora' },
  { id: 'cremes', title: 'Cremes', subtitle: 'Pra dar aquela camada extra' },
  { id: 'crocantes', title: 'Crocantes', subtitle: 'O barulhinho da colherada' },
  { id: 'caldas', title: 'Caldas', subtitle: 'Por cima de tudo' },
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
