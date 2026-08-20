/**
 * Ícone de um complemento deduzido do nome.
 *
 * A loja cadastra dezenas de complementos no painel e quase nunca preenche o
 * emoji: o card do montador ficava com um ponto no lugar da ilustração. Aqui o
 * nome é lido e devolve o ícone que combina, então o cadastro pode ser só
 * "Paçoca" que o site desenha 🥜.
 *
 * Vale para o que já está no banco e para o que for cadastrado daqui pra
 * frente: a leitura do cardápio troca o emoji vazio pela sugestão, e a escrita
 * grava a sugestão quando o campo fica em branco.
 */

import { foldWords } from '../lib/text'

interface EmojiRule {
  readonly emoji: string
  readonly terms: readonly string[]
}

/**
 * O que a loja vende, agrupado por ícone. A ordem da lista não importa: na
 * hora de casar, o termo mais longo ganha, então "leite em pó" nunca perde
 * para "leite" e "sonho de valsa" nunca perde para "valsa".
 */
const rules: readonly EmojiRule[] = [
  { emoji: '🍓', terms: ['morango', 'framboesa'] },
  { emoji: '🍌', terms: ['banana'] },
  { emoji: '🥝', terms: ['kiwi'] },
  { emoji: '🍍', terms: ['abacaxi'] },
  { emoji: '🍇', terms: ['uva', 'acai', 'jabuticaba'] },
  { emoji: '🍉', terms: ['melancia'] },
  { emoji: '🍈', terms: ['melao', 'maracuja', 'cupuacu', 'graviola'] },
  { emoji: '🥭', terms: ['manga', 'mamao'] },
  { emoji: '🍎', terms: ['maca'] },
  { emoji: '🍐', terms: ['pera', 'goiaba'] },
  { emoji: '🍊', terms: ['laranja', 'tangerina', 'mexerica'] },
  { emoji: '🍋', terms: ['limao'] },
  { emoji: '🍑', terms: ['pessego'] },
  { emoji: '🍒', terms: ['cereja', 'acerola'] },
  { emoji: '🫐', terms: ['amora', 'mirtilo', 'blueberry'] },
  { emoji: '🥥', terms: ['coco', 'coco ralado', 'prestigio', 'beijinho'] },

  {
    emoji: '🍫',
    terms: [
      'chocolate',
      'chocolate branco',
      'choco',
      'chocopower',
      'chocoball',
      'disket',
      'disqueti',
      'nutella',
      'ovomaltine',
      'bis',
      'bono',
      'bueno',
      'kinder',
      'kitkat',
      'kit kat',
      'trento',
      'baton',
      'batom',
      'diamante negro',
      'sonho de valsa',
      'ouro branco',
      'serenata',
      'ferrero',
      'brigadeiro',
      'brownie',
      'trufa',
      'negresco',
      'cobertura',
      'ganache',
      'nescau',
      'nesquik',
    ],
  },
  { emoji: '🌰', terms: ['avela', 'castanha', 'nozes', 'amendoa', 'noz pecan'] },
  { emoji: '🥜', terms: ['pacoca', 'pacoquita', 'amendoim', 'pasta de amendoim'] },
  {
    emoji: '🥛',
    terms: [
      'leite',
      'leite em po',
      'leite ninho',
      'leite condensado',
      'leitinho',
      'ninho',
      'chantininho',
      'iogurte',
      'creme de leite',
    ],
  },
  {
    emoji: '🍮',
    terms: ['doce de leite', 'pudim', 'caramelo', 'mousse', 'flan', 'gelatina', 'creme', 'danete'],
  },
  { emoji: '🍦', terms: ['sorvete', 'chantilly', 'chantily', 'baunilha'] },
  { emoji: '🍪', terms: ['oreo', 'biscoito', 'bolacha', 'cookie', 'wafer', 'waffer'] },
  { emoji: '🌾', terms: ['granola', 'aveia', 'cereal', 'flocos', 'quinoa', 'chia', 'linhaca'] },
  { emoji: '🥣', terms: ['sucrilhos', 'crocante', 'crocantes', 'farofa', 'tapioca'] },
  { emoji: '🍬', terms: ['bala', 'jujuba', 'gominha', 'confete', 'tic tac'] },
  { emoji: '🍡', terms: ['marshmallow', 'marshmello', 'sagu'] },
  { emoji: '🧇', terms: ['waffle'] },
  { emoji: '🍯', terms: ['mel'] },
  { emoji: '🍰', terms: ['bolo', 'cheesecake', 'torta'] },
  { emoji: '🍿', terms: ['pipoca'] },
]

/** Ícone padrão de uma categoria, quando nenhum termo do nome casa. */
const categoryRules: readonly EmojiRule[] = [
  { emoji: '🍓', terms: ['fruta', 'frutas'] },
  { emoji: '🍦', terms: ['creme', 'cremes'] },
  { emoji: '🥣', terms: ['crocante', 'crocantes'] },
  { emoji: '🍯', terms: ['calda', 'caldas'] },
  { emoji: '🍫', terms: ['cobertura', 'coberturas', 'chocolate'] },
  { emoji: '🥜', terms: ['complemento', 'complementos', 'adicional', 'adicionais'] },
]

/** Termo mais longo primeiro: o específico sempre ganha do genérico. */
const flatten = (list: readonly EmojiRule[]): readonly { term: string; emoji: string }[] =>
  list
    .flatMap((rule) => rule.terms.map((term) => ({ term: foldWords(term), emoji: rule.emoji })))
    .sort((a, b) => b.term.length - a.term.length)

const toppingTerms = flatten(rules)
const categoryTerms = flatten(categoryRules)

/** true quando o termo aparece como palavra inteira, e não no meio de outra. */
const hasTerm = (name: string, term: string): boolean =>
  name === term || new RegExp(`(^| )${term}( |$)`).test(name)

const findEmoji = (
  text: string,
  terms: readonly { term: string; emoji: string }[],
): string | null => {
  const name = foldWords(text)
  if (name === '') return null
  return terms.find((entry) => hasTerm(name, entry.term))?.emoji ?? null
}

/** Ícone de quando nem o nome nem a categoria dizem nada. */
export const FALLBACK_EMOJI = '✨'

/**
 * Emoji sugerido para um complemento. Tenta o nome primeiro e, se ele não
 * disser nada (marca nova, nome inventado), cai no ícone da categoria.
 */
export const suggestEmoji = (name: string, categoryTitle = ''): string =>
  findEmoji(name, toppingTerms) ?? findEmoji(categoryTitle, categoryTerms) ?? FALLBACK_EMOJI

/**
 * O que a loja digitou e não serve como ícone: campo vazio, um ponto, um traço
 * ou o coringa que o cadastro gravava sozinho.
 */
const placeholders: ReadonlySet<string> = new Set([
  '',
  '.',
  '..',
  '...',
  '-',
  '·',
  '•',
  FALLBACK_EMOJI,
])

const isPlaceholder = (emoji: string): boolean => placeholders.has(emoji.trim())

/**
 * Emoji que a tela mostra: o escolhido pela loja quando existe, a sugestão
 * quando não existe. Vale também para o que já está gravado no banco.
 */
export const toppingEmoji = (emoji: string, name: string, categoryTitle = ''): string =>
  isPlaceholder(emoji) ? suggestEmoji(name, categoryTitle) : emoji.trim()
