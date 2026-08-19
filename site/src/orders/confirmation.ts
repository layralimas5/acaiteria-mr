/**
 * Quais pedidos deste navegador o cliente já confirmou como recebidos.
 *
 * A confirmação é o gancho do depoimento: quem toca em "recebi" acabou de
 * receber o açaí, é a hora certa de pedir a nota. Depois de confirmado, o
 * pedido não pergunta de novo.
 */

const STORAGE_KEY = 'acaiteria-mr:confirmed-orders'

const read = (): readonly string[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

export const hasConfirmed = (code: string): boolean => read().includes(code)

export const markConfirmed = (code: string): void => {
  if (hasConfirmed(code)) return

  try {
    // Só os últimos importam: o histórico completo não serve para nada aqui.
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...read(), code].slice(-30)))
  } catch {
    // Sem storage: no máximo o card de confirmação reaparece numa próxima visita.
  }
}
