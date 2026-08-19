import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente único do Supabase.
 *
 * As credenciais vêm do ambiente (`.env`), nunca do código. A chave `anon` é
 * pública por natureza: quem protege os dados é o Row Level Security do banco,
 * não o segredo da chave (ver `supabase/migrations/0001_init.sql`).
 */

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** false quando o `.env` ainda não foi preenchido: o site avisa em vez de quebrar. */
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient = createClient(url ?? 'http://localhost', anonKey ?? 'anon', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

/** Mensagem de erro legível, para a tela nunca mostrar objeto cru. */
export const errorMessage = (error: unknown): string => {
  if (!isSupabaseConfigured) {
    return 'Banco não configurado. Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.'
  }
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return 'Não foi possível falar com o servidor. Tente de novo.'
}
