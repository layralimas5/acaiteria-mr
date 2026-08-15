/**
 * Controle de esgotados.
 *
 * O catálogo (`data/builder.ts`) diz o que a loja vende; este arquivo guarda o
 * que acabou hoje. São coisas diferentes de propósito: o catálogo só muda com
 * publicação do site, e o esgotado a loja marca sozinha no painel, na hora.
 *
 * Fica no navegador, como os pedidos. Quando o Supabase entrar, a mesma
 * interface passa a ler e gravar lá — nenhuma tela muda.
 */

const STORAGE_KEY = 'acaiteria-mr:stock'
const CHANGED_EVENT = 'acaiteria-mr:stock-changed'

/** Ids marcados como esgotados. */
export type SoldOutMap = Readonly<Record<string, boolean>>

export const readStock = (): SoldOutMap => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    return parsed !== null && typeof parsed === 'object' ? (parsed as SoldOutMap) : {}
  } catch {
    return {}
  }
}

const write = (map: SoldOutMap): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // Sem storage disponível: vale só para a sessão atual.
  }
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT))
}

export const setSoldOut = (id: string, soldOut: boolean): void => {
  const current = { ...readStock() }
  if (soldOut) {
    current[id] = true
  } else {
    delete current[id]
  }
  write(current)
}

/** Repõe tudo de uma vez, no começo do expediente. */
export const clearSoldOut = (): void => write({})

/** Avisa quando o estoque mudar, inclusive em outra aba do navegador. */
export const subscribeToStock = (listener: () => void): (() => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener()
  }

  window.addEventListener(CHANGED_EVENT, listener)
  window.addEventListener('storage', onStorage)

  return () => {
    window.removeEventListener(CHANGED_EVENT, listener)
    window.removeEventListener('storage', onStorage)
  }
}
