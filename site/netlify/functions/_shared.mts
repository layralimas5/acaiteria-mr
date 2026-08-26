import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Chão comum das funções de pagamento.
 *
 * Estas funções rodam no servidor do Netlify, não no navegador. É por isso que
 * elas existem: o link de pagamento precisa nascer a partir do total que está
 * no banco, e não do que o navegador diz. Se o link fosse gerado no site, o
 * cliente escolheria quanto pagar.
 *
 * Nada daqui vai para o bundle do site: a pasta `netlify/` fica fora do
 * `src/`, e o Vite não a enxerga.
 */

/** Variável obrigatória do ambiente. Falta dela é erro de configuração, não do cliente. */
const required = (name: string): string => {
  const value = process.env[name]
  if (!value) throw new Error(`Variável de ambiente ausente: ${name}`)
  return value
}

export const infinitePayHandle = (): string => required('INFINITEPAY_HANDLE').replace(/^\$/, '')

/**
 * Cliente do banco com a chave `service_role`: ignora o Row Level Security de
 * propósito, porque aqui é o servidor da loja falando, não um visitante. Esta
 * chave só existe nas variáveis do Netlify e nunca sai deste arquivo.
 */
export const admin = (): SupabaseClient =>
  createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  })

export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })

/** Reais para centavos, que é a unidade que a InfinitePay usa. */
export const toCents = (value: number): number => Math.round(value * 100)

export const CHECKOUT_API = 'https://api.checkout.infinitepay.io'
