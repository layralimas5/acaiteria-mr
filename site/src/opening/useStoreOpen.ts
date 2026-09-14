import { useStoreClock } from '../hooks/useStoreClock'
import { openStatus } from '../lib/order'
import type { OpenStatus, StoreOverride } from '../lib/order'
import { useStoreOverride } from './useStoreOverride'

export interface StoreOpenState {
  /** Hora atual pelo relógio da loja, recalculada a cada minuto. */
  readonly now: Date
  readonly override: StoreOverride
  readonly status: OpenStatus
}

/**
 * A loja está recebendo pedido agora?
 *
 * Junta as duas fontes: o relógio (que fecha e abre a loja na hora certa) e a
 * decisão da equipe no painel (que passa por cima do relógio). Qualquer tela
 * que mostre "aberto" ou "fechado" lê daqui, para não haver duas respostas
 * diferentes na mesma página.
 */
export const useStoreOpen = (): StoreOpenState => {
  const now = useStoreClock()
  const { override } = useStoreOverride()

  return { now, override, status: openStatus(now, override) }
}
