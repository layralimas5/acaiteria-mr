import { useCallback, useSyncExternalStore } from 'react'
import { createEmitter } from '../lib/emitter'
import type { WhatsAppChannel } from '../orders/messages'

/**
 * Preferência de onde abrir a conversa com o cliente, guardada neste
 * navegador. Card, entregas e configurações leem a mesma fonte, então trocar
 * nas configurações vale na hora para o painel inteiro.
 */

const STORAGE_KEY = 'acaiteria-mr:admin-whatsapp'
const changes = createEmitter()

/**
 * Sem escolha salva, o celular vai direto para o app: pelo wa.me cada aviso
 * deixava uma aba nova para trás, e quem voltava do WhatsApp caía nela em vez
 * do painel. No computador o padrão segue o WhatsApp Web, que funciona mesmo
 * sem o app instalado.
 */
const defaultChannel = (): WhatsAppChannel =>
  window.matchMedia('(pointer: coarse)').matches ? 'app' : 'web'

const read = (): WhatsAppChannel => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved === 'app' || saved === 'web' ? saved : defaultChannel()
  } catch {
    return defaultChannel()
  }
}

const save = (channel: WhatsAppChannel): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, channel)
  } catch (cause) {
    // Sem armazenamento a escolha vale só até recarregar a página.
    console.warn('[painel] Não deu para guardar a preferência do WhatsApp.', cause)
  }
  changes.emit()
}

export const useWhatsAppChannel = (): readonly [WhatsAppChannel, (next: WhatsAppChannel) => void] => {
  const channel = useSyncExternalStore(changes.subscribe, read)
  const change = useCallback((next: WhatsAppChannel) => save(next), [])
  return [channel, change]
}

/**
 * Abre a conversa pelo canal escolhido. O WhatsApp Web precisa de aba nova; o
 * app é aberto pelo próprio sistema operacional, e a página continua onde está.
 */
export const openWhatsApp = (url: string, channel: WhatsAppChannel): void => {
  if (channel === 'app') {
    window.location.href = url
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

/** Atributos do link "avisar cliente": aba nova só faz sentido no WhatsApp Web. */
export const whatsAppLinkProps = (channel: WhatsAppChannel) =>
  channel === 'web' ? ({ target: '_blank', rel: 'noopener noreferrer' } as const) : ({} as const)
