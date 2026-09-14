import { useEffect, useState } from 'react'
import { noOverride } from '../lib/order'
import type { StoreOverride } from '../lib/order'
import { errorMessage } from '../lib/supabase'
import { fetchStoreOverride, saveStoreOverride, subscribeToStoreOverride } from './api'

/**
 * A decisão da equipe (aberto ou fechado na mão), compartilhada por toda a
 * aplicação.
 *
 * O site pergunta isso em mais de um lugar (banner, montador, horário) e o
 * painel muda. Em vez de cada tela buscar e assinar a sua, há um cache único:
 * a primeira tela que monta busca e abre o canal em tempo real, as outras
 * aproveitam, e a última que sai fecha o canal.
 *
 * Enquanto a resposta não chega vale `noOverride`: o horário decide sozinho,
 * que é o que acontece na maior parte do tempo.
 */

interface OverrideState {
  readonly override: StoreOverride
  readonly loading: boolean
  readonly error: string | null
}

let state: OverrideState = { override: noOverride, loading: true, error: null }
let inflight: Promise<void> | null = null
let unsubscribe: (() => void) | null = null

const listeners = new Set<() => void>()

const publish = (next: OverrideState): void => {
  state = next
  for (const listener of listeners) listener()
}

const load = (): Promise<void> => {
  if (inflight) return inflight

  inflight = fetchStoreOverride()
    .then((override) => publish({ override, loading: false, error: null }))
    .catch((error: unknown) =>
      publish({ override: state.override, loading: false, error: errorMessage(error) }),
    )
    .finally(() => {
      inflight = null
    })

  return inflight
}

/**
 * O canal em tempo real pode cair com o celular em segundo plano. Ao voltar
 * para a aba, buscar de novo custa uma leitura e garante que a tela mostra o
 * que está no banco.
 */
const reloadWhenVisible = (): void => {
  if (document.visibilityState === 'visible') void load()
}

const connect = (): void => {
  if (unsubscribe) return
  const stopChannel = subscribeToStoreOverride(() => void load())
  document.addEventListener('visibilitychange', reloadWhenVisible)
  unsubscribe = () => {
    stopChannel()
    document.removeEventListener('visibilitychange', reloadWhenVisible)
  }
}

const disconnect = (): void => {
  unsubscribe?.()
  unsubscribe = null
}

/** Grava a decisão e já reflete na tela, sem esperar o canal avisar de volta. */
export const setStoreOverride = async (override: StoreOverride): Promise<void> => {
  await saveStoreOverride(override)
  publish({ override, loading: false, error: null })
}

export interface UseStoreOverrideResult extends OverrideState {
  readonly reload: () => Promise<void>
}

export const useStoreOverride = (): UseStoreOverrideResult => {
  const [snapshot, setSnapshot] = useState<OverrideState>(state)

  useEffect(() => {
    const listener = () => setSnapshot(state)
    listeners.add(listener)
    connect()

    if (state.loading && !inflight) void load()
    listener()

    return () => {
      listeners.delete(listener)
      if (listeners.size === 0) disconnect()
    }
  }, [])

  return { ...snapshot, reload: load }
}
