import { business } from '../config/business'
import { supabase } from '../lib/supabase'
import type { PaymentMethod, PaymentStatus } from './types'

/**
 * Pagamento online, pelo checkout da InfinitePay.
 *
 * O site não fala com a InfinitePay: ele pede o link para a função servidor
 * (`site/netlify/functions/pagamento-link.mts`), que monta a cobrança a partir
 * do total gravado no banco. É de propósito — link gerado aqui seria link com
 * o valor que o navegador quisesse.
 */

/**
 * Formas pagas na hora, pela InfinitePay. O checkout mostra Pix e cartão como
 * duas opções separadas, mas as duas levam para a mesma tela: a API de link
 * não deixa fixar o meio, então o cliente confirma lá o que escolheu aqui. O
 * Pix só cai nesse caminho quando não há chave manual (`payments.pixKey`).
 */
export const paysOnline = (method: PaymentMethod): boolean =>
  business.payments.onlineCheckout &&
  (method === 'online' || (method === 'pix' && business.payments.pixKey === ''))

/** Endereço da função. Mesma origem do site, então vale em produção e em preview. */
const LINK_ENDPOINT = '/api/pagamento-link'

/**
 * Link do checkout para um pedido já criado. Devolve a URL para onde o cliente
 * deve ser levado.
 */
export const paymentLink = async (code: string): Promise<string> => {
  const response = await fetch(LINK_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code }),
  })

  const payload = (await response.json().catch(() => null)) as
    | { url?: string; error?: string }
    | null

  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error ?? 'Não foi possível abrir o pagamento agora.')
  }

  return payload.url
}

/**
 * Em que pé está a cobrança de um pedido.
 *
 * Usado quando o cliente volta do checkout: a InfinitePay devolve ele para o
 * site antes de o webhook necessariamente ter chegado, então a tela pergunta
 * ao banco em vez de acreditar na URL de retorno. `null` quando o pedido não
 * existe ou o banco não respondeu.
 */
export const paymentStatusOf = async (code: string): Promise<PaymentStatus | null> => {
  const { data, error } = await supabase.rpc('order_payment_status', { p_code: code })
  if (error) return null
  return (data as PaymentStatus | null) ?? null
}
