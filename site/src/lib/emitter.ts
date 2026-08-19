/**
 * Aviso de "isso mudou" entre telas da mesma aba.
 *
 * Os dados moram no Supabase, mas quem acabou de gravar precisa avisar as
 * outras telas abertas para elas buscarem de novo. Para os pedidos existe o
 * Realtime, que atravessa aparelhos; para o resto (estoque, caixa, cardápio),
 * quem grava é sempre a mesma pessoa no mesmo painel, então este aviso local
 * resolve sem custo nenhum.
 */

export interface Emitter {
  readonly emit: () => void
  readonly subscribe: (listener: () => void) => () => void
}

export const createEmitter = (): Emitter => {
  const listeners = new Set<() => void>()

  return {
    emit: () => {
      for (const listener of listeners) listener()
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
