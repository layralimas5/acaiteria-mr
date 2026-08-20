/**
 * Foto do tamanho deduzida do volume.
 *
 * As fotos de estúdio da loja são por embalagem, e a embalagem está no nome do
 * tamanho: "1 litro" é sempre o mesmo pote. Quando a loja cadastra um tamanho
 * novo e não cola o caminho da foto, o volume decide qual usar, e o card do
 * montador já nasce com a imagem certa em vez do quadrado roxo com o texto.
 *
 * Mesma ideia do ícone dos complementos, em `emoji.ts`.
 */

import { foldWords } from '../lib/text'

interface ImageRule {
  readonly image: string
  readonly terms: readonly string[]
}

/** Fotos que existem em `public/imagem`, geradas por `npm run images`. */
const rules: readonly ImageRule[] = [
  { image: '/imagem/poto-300ml.webp', terms: ['300', '300ml', '300 ml'] },
  { image: '/imagem/pote-500ml.webp', terms: ['500', '500ml', '500 ml'] },
  { image: '/imagem/copo-700ml.webp', terms: ['700', '700ml', '700 ml'] },
  {
    image: '/imagem/1-litro.webp',
    terms: ['1l', '1 l', '1 litro', 'litro', '1000', '1000ml', '1000 ml'],
  },
]

/** Termo mais longo primeiro, para "1000 ml" não perder para "1000". */
const terms = rules
  .flatMap((rule) => rule.terms.map((term) => ({ term: foldWords(term), image: rule.image })))
  .sort((a, b) => b.term.length - a.term.length)

const hasTerm = (text: string, term: string): boolean =>
  text === term || new RegExp(`(^| )${term}( |$)`).test(text)

/**
 * Caminho da foto que combina com o tamanho, ou null quando a loja cadastrou
 * uma embalagem que ainda não tem foto no site.
 */
export const sizeImage = (volume: string, name = ''): string | null => {
  const text = foldWords(`${volume} ${name}`)
  if (text === '') return null
  return terms.find((entry) => hasTerm(text, entry.term))?.image ?? null
}
