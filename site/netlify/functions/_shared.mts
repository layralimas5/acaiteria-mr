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

/**
 * Pedido que chega de outro site.
 *
 * A função é pública por natureza: quem tem o endereço, chama. O que dá para
 * exigir é que uma chamada feita por navegador venha da própria loja — página
 * de terceiro que tente usar o endpoint em nome de quem está logado esbarra
 * aqui. Requisição sem `Origin` (curl, servidor, o próprio webhook) segue: o
 * cabeçalho é uma pista, não uma prova, e quem a barra é o limite de uso.
 */
export const isForeignOrigin = (request: Request): boolean => {
  const origin = request.headers.get('origin')
  if (!origin) return false
  return origin !== new URL(request.url).origin
}

/**
 * Limite de uso por endereço de rede, na memória desta instância.
 *
 * Não é um contador global (cada instância tem o seu, e elas somem), então não
 * serve como quota exata. Serve para o que precisa servir: um script que varre
 * números de pedido dispara centenas de chamadas em segundos, e é isso que
 * este contador corta antes de virar link de cobrança e pedido remarcado.
 */
const hits = new Map<string, { count: number; until: number }>()

export const rateLimited = (request: Request, limit: number, windowMs: number): boolean => {
  const ip =
    request.headers.get('x-nf-client-connection-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'desconhecido'

  const now = Date.now()
  const current = hits.get(ip)

  if (!current || current.until < now) {
    hits.set(ip, { count: 1, until: now + windowMs })
    // A memória é da instância e some com ela, mas enquanto vive não pode
    // crescer sem fim: o que já expirou sai junto.
    if (hits.size > 5000) {
      for (const [key, value] of hits) if (value.until < now) hits.delete(key)
    }
    return false
  }

  current.count += 1
  return current.count > limit
}

/**
 * Modo de teste do pagamento.
 *
 * Ligado, o link de cobrança não sai da InfinitePay: sai de uma tela do
 * próprio site que carimba o pedido como pago sem dinheiro nenhum trocar de
 * mão. Serve para andar o fluxo inteiro (pedido, checkout, retorno, painel)
 * quantas vezes for preciso.
 *
 * São duas travas e as duas precisam estar abertas. `PAGAMENTO_SIMULADO` é a
 * que se liga de propósito; `CONTEXT` é a rede embaixo — o Netlify escreve
 * "production" no deploy do domínio da loja, e ali a simulação não abre nem
 * que a variável tenha ido parar lá por engano. Em preview, branch deploy e
 * `netlify dev` o valor é outro, e é onde o teste roda.
 */
export const simulacaoDePagamento = (): boolean =>
  process.env.PAGAMENTO_SIMULADO === '1' && process.env.CONTEXT !== 'production'
