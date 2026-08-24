import { supabase } from '../lib/supabase'

/**
 * Entrada automática no painel durante o desenvolvimento.
 *
 * Analisar as telas internas (pedidos, caixa, estoque, cardápio) exigia
 * digitar e-mail e senha a cada recarga do Vite. Aqui o navegador faz esse
 * login sozinho, com as credenciais do `.env.development`.
 *
 * Continua sendo um login de verdade: o Row Level Security do banco não abre
 * exceção para ninguém, e sem o crachá do Supabase o painel voltaria vazio.
 * Por isso o atalho é a digitação, não a autenticação.
 *
 * Nada disso existe no site publicado. `import.meta.env.DEV` é falso no build,
 * e as variáveis moram em `.env.development`, arquivo que o Vite só lê no modo
 * de desenvolvimento e que o git ignora: no bundle publicado as duas chegam
 * como `undefined` e o atalho nem se arma.
 */

const email = import.meta.env.VITE_DEV_ADMIN_EMAIL?.trim()
const password = import.meta.env.VITE_DEV_ADMIN_PASSWORD

/** true quando o `.env` local trouxe as duas variáveis do atalho. */
export const isDevAutoLoginEnabled = Boolean(import.meta.env.DEV && email && password)

let attempt: Promise<void> | null = null

/**
 * Entra no painel com a conta de desenvolvimento. Uma tentativa por sessão do
 * navegador: senha errada avisa no console e devolve a tela de login normal,
 * em vez de repetir a chamada a cada montagem do React.
 */
export const devAutoLogin = (): Promise<void> => {
  if (!isDevAutoLoginEnabled) return Promise.resolve()
  if (attempt) return attempt

  attempt = supabase.auth
    .signInWithPassword({ email: email as string, password: password as string })
    .then(({ error }) => {
      if (error) {
        console.warn(`[dev] Login automático falhou: ${error.message}`)
        return
      }
      console.info(`[dev] Painel aberto como ${email as string}.`)
    })

  return attempt
}
