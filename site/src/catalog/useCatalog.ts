import { useEffect, useState } from 'react'
import { errorMessage } from '../lib/supabase'
import { fetchCatalog } from './api'
import type { Catalog } from './types'
import { emptyCatalog } from './types'

/**
 * Cardápio compartilhado por toda a aplicação.
 *
 * O cardápio é o mesmo para o site e para o painel, e quase toda tela precisa
 * dele. Em vez de cada componente buscar o seu, existe um cache único aqui:
 * a primeira tela que monta busca, as outras aproveitam, e qualquer alteração
 * no painel avisa todo mundo de uma vez.
 */

interface CatalogState {
  readonly catalog: Catalog
  readonly loading: boolean
  readonly error: string | null
}

let state: CatalogState = { catalog: emptyCatalog, loading: true, error: null }
let inflight: Promise<void> | null = null

const listeners = new Set<() => void>()

const publish = (next: CatalogState): void => {
  state = next
  for (const listener of listeners) listener()
}

const load = (): Promise<void> => {
  if (inflight) return inflight

  inflight = fetchCatalog()
    .then((catalog) => publish({ catalog, loading: false, error: null }))
    .catch((error: unknown) =>
      publish({ catalog: emptyCatalog, loading: false, error: errorMessage(error) }),
    )
    .finally(() => {
      inflight = null
    })

  return inflight
}

/** Busca o cardápio de novo. Chamar depois de qualquer alteração no painel. */
export const reloadCatalog = (): Promise<void> => {
  publish({ ...state, loading: true })
  return load()
}

export interface UseCatalogResult extends CatalogState {
  readonly reload: () => Promise<void>
}

export const useCatalog = (): UseCatalogResult => {
  const [snapshot, setSnapshot] = useState<CatalogState>(state)

  useEffect(() => {
    const listener = () => setSnapshot(state)
    listeners.add(listener)

    // A primeira tela que montar dispara a busca; as demais só assistem.
    if (state.loading && !inflight) void load()
    listener()

    return () => {
      listeners.delete(listener)
    }
  }, [])

  return { ...snapshot, reload: reloadCatalog }
}
