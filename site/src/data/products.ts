export type ProductCategory = 'copos' | 'potes' | 'especiais' | 'bebidas'

export interface Product {
  readonly id: string
  readonly name: string
  readonly size: string
  readonly price: number
  readonly description: string
  readonly category: ProductCategory
  readonly toppingsIncluded: number
  readonly highlight?: string
}

export interface CategoryMeta {
  readonly id: ProductCategory
  readonly label: string
}

export const categories: readonly CategoryMeta[] = [
  { id: 'copos', label: 'Copos' },
  { id: 'potes', label: 'Potes' },
  { id: 'especiais', label: 'Especiais' },
  { id: 'bebidas', label: 'Bebidas' },
]

export const products: readonly Product[] = [
  {
    id: 'copo-300',
    name: 'Copo 300ml',
    size: '300ml',
    price: 14.9,
    description: 'Pra matar a vontade sem pesar. Açaí batido na hora com 2 complementos.',
    category: 'copos',
    toppingsIncluded: 2,
  },
  {
    id: 'copo-500',
    name: 'Copo 500ml',
    size: '500ml',
    price: 19.9,
    description: 'O tamanho que mais sai. Cremoso do começo ao fim, com 3 complementos.',
    category: 'copos',
    toppingsIncluded: 3,
    highlight: 'Mais pedido',
  },
  {
    id: 'copo-700',
    name: 'Copo 700ml',
    size: '700ml',
    price: 24.9,
    description: 'Pra quem não quer dividir. 4 complementos à sua escolha.',
    category: 'copos',
    toppingsIncluded: 4,
  },
  {
    id: 'pote-150',
    name: 'Pote 150g',
    size: '150g',
    price: 11.9,
    description: 'Porção individual pronta pra levar. Ideal pra lanche rápido.',
    category: 'potes',
    toppingsIncluded: 1,
  },
  {
    id: 'pote-300',
    name: 'Pote 300g',
    size: '300g',
    price: 18.9,
    description: 'Açaí puro no pote, com 2 complementos separados pra montar em casa.',
    category: 'potes',
    toppingsIncluded: 2,
  },
  {
    id: 'pote-500',
    name: 'Pote 500g',
    size: '500g',
    price: 27.9,
    description: 'Dá pra dois. Vem com 3 complementos embalados à parte.',
    category: 'potes',
    toppingsIncluded: 3,
    highlight: 'Rende 2 porções',
  },
  {
    id: 'barca-1l',
    name: 'Barca da Casa',
    size: '1 litro',
    price: 49.9,
    description: 'Açaí, banana, morango, leite ninho, granola, paçoca e leite condensado.',
    category: 'especiais',
    toppingsIncluded: 6,
    highlight: 'Pra compartilhar',
  },
  {
    id: 'acai-fit',
    name: 'Açaí Fit',
    size: '400ml',
    price: 22.9,
    description: 'Açaí zero açúcar com banana, granola sem açúcar e pasta de amendoim.',
    category: 'especiais',
    toppingsIncluded: 3,
  },
  {
    id: 'combo-casal',
    name: 'Combo Casal',
    size: '2 x 500ml',
    price: 36.9,
    description: 'Dois copos de 500ml com 3 complementos cada e duas colheres.',
    category: 'especiais',
    toppingsIncluded: 6,
  },
  {
    id: 'vitamina-acai',
    name: 'Vitamina de Açaí',
    size: '500ml',
    price: 17.9,
    description: 'Açaí batido com leite e banana. Mais leve, pra tomar no copo.',
    category: 'bebidas',
    toppingsIncluded: 0,
  },
  {
    id: 'suco-natural',
    name: 'Suco Natural',
    size: '400ml',
    price: 9.9,
    description: 'Laranja, maracujá, abacaxi ou limão. Feito na hora, sem açúcar.',
    category: 'bebidas',
    toppingsIncluded: 0,
  },
  {
    id: 'refrigerante',
    name: 'Refrigerante Lata',
    size: '350ml',
    price: 6.5,
    description: 'Coca-Cola, Guaraná, Fanta ou Sprite geladinhos.',
    category: 'bebidas',
    toppingsIncluded: 0,
  },
]

export interface ToppingGroup {
  readonly title: string
  readonly items: readonly string[]
}

export const toppingGroups: readonly ToppingGroup[] = [
  {
    title: 'Frutas',
    items: ['Banana', 'Morango', 'Kiwi', 'Manga', 'Uva', 'Abacaxi'],
  },
  {
    title: 'Crocantes',
    items: ['Granola', 'Paçoca', 'Amendoim', 'Bis', 'Ovomaltine', 'Sucrilhos'],
  },
  {
    title: 'Cremes e caldas',
    items: ['Leite condensado', 'Leite ninho', 'Nutella', 'Doce de leite', 'Pasta de amendoim', 'Mel'],
  },
]
