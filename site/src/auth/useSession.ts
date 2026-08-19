import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

/**
 * Sessão da loja no painel.
 *
 * O site é aberto a qualquer visitante, mas o painel não: pedido, caixa e
 * estoque são dados de gente real. Quem protege isso é o Row Level Security do
 * banco, que só libera para usuário autenticado; o login aqui é o que dá esse
 * crachá ao navegador.
 */

interface SessionState {
  readonly session: Session | null
  /** true enquanto o Supabase ainda não disse se existe sessão salva. */
  readonly loading: boolean
}

export const useSession = (): SessionState => {
  const [state, setState] = useState<SessionState>({ session: null, loading: true })

  useEffect(() => {
    let active = true

    void supabase.auth.getSession().then(({ data }) => {
      if (active) setState({ session: data.session, loading: false })
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setState({ session, loading: false })
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  return state
}

export const signIn = async (email: string, password: string): Promise<void> => {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw error
}

export const signOut = async (): Promise<void> => {
  await supabase.auth.signOut()
}
