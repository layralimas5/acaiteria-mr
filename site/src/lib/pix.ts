/**
 * Pix copia e cola (BR Code).
 *
 * Monta o código que o cliente cola no app do banco já com o valor do pedido
 * e a chave da loja. Sem isso ele digita a chave na mão, erra o valor e a
 * loja perde tempo conferindo cada comprovante.
 *
 * O formato é o EMV do Banco Central: uma sequência de campos
 * `id + tamanho + valor`, fechada por um CRC16. Nada aqui depende de rede:
 * é o mesmo código que o banco leria de um QR impresso no balcão.
 */

import { business } from '../config/business'

/** Um campo do EMV: id, tamanho em dois dígitos e o valor. */
const field = (id: string, value: string): string =>
  `${id}${String(value.length).padStart(2, '0')}${value}`

/**
 * ASCII maiúsculo, sem acento e sem símbolo estranho: é o que os apps de
 * banco aceitam em nome e cidade. "Açaiteria MR" vira "ACAITERIA MR".
 */
const ascii = (text: string, max: number): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim()
    .toUpperCase()
    .slice(0, max)

/** Identificador da transação: só letra e número, do jeito que o padrão exige. */
const txid = (reference: string): string => {
  const clean = ascii(reference, 25).replace(/[^A-Z0-9]/g, '')
  return clean === '' ? '***' : clean
}

/**
 * CRC16-CCITT (polinômio 0x1021, início 0xFFFF), que é o que fecha o código.
 * Um dígito errado aqui faz o app do banco recusar o colado inteiro.
 */
const crc16 = (payload: string): string => {
  let crc = 0xffff

  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8

    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export interface PixCharge {
  /** Chave Pix da loja, exatamente como cadastrada no banco. */
  readonly key: string
  /** Nome do recebedor que aparece na tela do cliente. */
  readonly holder: string
  /** Município do recebedor. */
  readonly city: string
  /** Valor em reais. Zero ou negativo gera código sem valor definido. */
  readonly amount: number
  /** Referência mostrada no extrato da loja, normalmente o número do pedido. */
  readonly reference: string
}

/** O código copia e cola pronto para o cliente colar no banco. */
export const pixPayload = ({ key, holder, city, amount, reference }: PixCharge): string => {
  const merchantAccount = field('00', 'br.gov.bcb.pix') + field('01', key.trim())

  // O campo do valor é omitido quando não há valor fechado: nesse caso o
  // cliente digita quanto vai pagar, em vez de receber um código com R$ 0,00.
  const payload = [
    field('00', '01'),
    field('26', merchantAccount),
    field('52', '0000'),
    field('53', '986'),
    amount > 0 ? field('54', amount.toFixed(2)) : '',
    field('58', 'BR'),
    field('59', ascii(holder, 25) || 'RECEBEDOR'),
    field('60', ascii(city, 15) || 'BRASIL'),
    field('62', field('05', txid(reference))),
  ].join('')

  // O CRC entra sobre o payload já com o próprio cabeçalho "6304" no fim.
  const withCrcHeader = `${payload}6304`
  return `${withCrcHeader}${crc16(withCrcHeader)}`
}

/** true quando a loja já cadastrou a chave e o Pix pode aparecer na tela. */
export const pixEnabled = (): boolean => business.payments.pixKey.trim() !== ''

/**
 * Código do pedido desta loja. Lê a configuração para que nenhuma tela
 * precise conhecer chave, titular ou cidade.
 */
export const storePixCode = (amount: number, reference: string): string | null => {
  if (!pixEnabled()) return null

  return pixPayload({
    key: business.payments.pixKey,
    holder: business.payments.pixHolder,
    city: business.payments.pixCity,
    amount,
    reference,
  })
}
