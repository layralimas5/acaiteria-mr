import { useEffect, useState } from 'react'

/**
 * Relógio da loja: a hora atual, recalculada de minuto em minuto.
 *
 * A página fica aberta por muito tempo — o cliente monta o pedido, conversa,
 * volta —, então perguntar a hora uma vez na renderização não serve para
 * decidir se a loja está aberta: às 23:01 a tela continuaria aceitando pedido
 * porque foi carregada às 22:40. Com este relógio, a loja fecha e abre na tela
 * sozinha, sem o cliente recarregar nada.
 *
 * O tique é alinhado à virada do minuto para a mudança acontecer na hora certa,
 * e não até 59 segundos depois dela.
 */
export function useStoreClock(): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let interval: number | undefined

    const untilNextMinute = 60_000 - (Date.now() % 60_000)
    const timeout = window.setTimeout(() => {
      setNow(new Date())
      interval = window.setInterval(() => setNow(new Date()), 60_000)
    }, untilNextMinute)

    return () => {
      window.clearTimeout(timeout)
      if (interval !== undefined) window.clearInterval(interval)
    }
  }, [])

  return now
}
