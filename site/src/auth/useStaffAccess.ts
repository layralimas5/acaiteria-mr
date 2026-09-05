import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Se esta conta é da loja.
 *
 * Ter sessão não é ter acesso. Desde a migration 0003 quem manda no banco é a
 * lista `store_staff`, e uma conta fora dela abria o painel inteiro para ver
 * telas vazias: nenhum dado vazava (o Row Level Security recusa linha por
 * linha), mas a pessoa ficava sem entender por que nada carrega, e o painel
 * dizia por omissão que ela estava dentro.
 *
 * Aqui a mesma pergunta que o banco faz é feita antes de desenhar o painel. É
 * uma camada a mais, não a proteção: quem protege continua sendo o RLS.
 */

export type StaffAccess = 'checking' | 'allowed' | 'denied' | 'error'

interface StaffAccessState {
  readonly access: StaffAccess
  readonly recheck: () => void
}

export const useStaffAccess = (userId: string | undefined): StaffAccessState => {
  const [access, setAccess] = useState<StaffAccess>('checking')
  const [attempt, setAttempt] = useState(0)

  const recheck = useCallback(() => {
    setAccess('checking')
    setAttempt((value) => value + 1)
  }, [])

  useEffect(() => {
    if (!userId) return
    let active = true

    // Falha de rede não é "pode entrar": sem resposta, o painel não abre.
    void Promise.resolve(supabase.rpc('is_store_staff'))
      .then(({ data, error }) => {
        if (!active) return
        setAccess(!error && data === true ? 'allowed' : error ? 'error' : 'denied')
      })
      .catch(() => {
        if (active) setAccess('error')
      })

    return () => {
      active = false
    }
  }, [userId, attempt])

  return { access, recheck }
}
