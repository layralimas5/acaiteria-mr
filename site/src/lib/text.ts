/**
 * Comparação de texto digitado por gente.
 *
 * Cliente escreve "Cariacica", "cariacica" e "CARIACICA"; a loja cadastra
 * "Paçoca" e o cliente procura "pacoca". Antes de comparar qualquer um desses,
 * o texto passa por aqui.
 */

/** Sem acento, em minúsculas e sem espaço sobrando. */
export const foldCase = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

/** Só letras, números e espaço simples: o formato em que os termos casam. */
export const foldWords = (text: string): string =>
  foldCase(text)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
