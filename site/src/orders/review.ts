/**
 * Quais pedidos deste navegador já foram avaliados.
 *
 * O convite de avaliação só faz sentido uma vez por pedido: depois de enviar,
 * ou de dispensar, o cliente não vê o mesmo pedido de novo.
 */

const STORAGE_KEY = 'acaiteria-mr:reviewed-orders'

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

export const hasReviewed = (code: string): boolean => read().includes(code)

export const markReviewed = (code: string): void => {
  if (hasReviewed(code)) return

  try {
    // Guarda só os últimos: o histórico completo não serve para nada aqui.
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...read(), code].slice(-30)))
  } catch {
    // Sem storage: no máximo o convite reaparece numa próxima visita.
  }
}
