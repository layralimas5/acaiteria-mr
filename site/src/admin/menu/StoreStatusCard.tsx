import { useState } from 'react'
import { business } from '../../config/business'
import {
  activeOverride,
  manualOpenEndsAt,
  nextOpeningAt,
  noOverride,
  scheduledOpen,
} from '../../lib/order'
import type { StoreOverride } from '../../lib/order'
import { errorMessage } from '../../lib/supabase'
import { useStoreOpen } from '../../opening/useStoreOpen'
import { setStoreOverride } from '../../opening/useStoreOverride'
import { ErrorNote, PrimaryButton } from './ui'

/**
 * Abrir e fechar os pedidos do site na mão.
 *
 * O horário cuida do dia a dia: abre às 18:30, fecha às 23:00, sem ninguém
 * tocar em nada. Este card é para a exceção. A noite rendeu e a loja quer
 * seguir depois das 23:00, ou acabou o açaí às 21:00 e não adianta o site
 * continuar aceitando pedido. Um clique aqui muda o site na hora, em todos os
 * celulares, e a trava do banco acompanha.
 *
 * Toda decisão caduca sozinha: fechou mais cedo, volta no próximo horário;
 * seguiu aberta, fecha no limite de `business.manualOpenLimit`. Assim uma
 * noite esquecida não vira um site aceitando pedido de manhã.
 */

const timeLabel = (date: Date): string =>
  date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

const dateTimeLabel = (date: Date): string =>
  date.toLocaleString('pt-BR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })

const closesAtLabel = (): string => business.hours[0]?.closesAt ?? ''

const sameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/**
 * O botão de abrir fala da situação: "reabrir" se a própria loja fechou,
 * "continuar" se o horário acabou e a noite segue, "abrir" antes da hora.
 */
const openLabel = (now: Date, override: StoreOverride): string => {
  if (activeOverride(override, now) === 'closed') return 'Reabrir os pedidos'
  const next = nextOpeningAt(now)
  if (next && sameDay(next, now)) return 'Abrir os pedidos agora'
  return 'Continuar recebendo pedidos'
}

/** O que dizer sobre o estado atual, além do "aberto" ou "fechado" do selo. */
const explanation = (now: Date, override: StoreOverride): string => {
  const mode = activeOverride(override, now)
  const ends = override.until

  if (mode === 'open') {
    return ends
      ? `Recebendo pedidos fora do horário. Fecha quando você clicar em fechar ou, no máximo, às ${timeLabel(ends)}.`
      : 'Recebendo pedidos fora do horário até você fechar.'
  }

  if (mode === 'closed') {
    return ends
      ? `Pedidos encerrados antes da hora. O site volta a abrir sozinho ${dateTimeLabel(ends)}.`
      : 'Pedidos encerrados antes da hora até você abrir de novo.'
  }

  return scheduledOpen(now)
    ? `No horário normal. O site fecha sozinho às ${closesAtLabel()}; se quiser seguir depois disso, volte aqui e clique em continuar recebendo.`
    : 'Fora do horário, seguindo a tabela. Se quiser receber pedido agora mesmo, é só abrir.'
}

export function StoreStatusCard() {
  const { now, override, status } = useStoreOpen()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = (next: StoreOverride) => {
    setBusy(true)
    setError(null)
    setStoreOverride(next)
      .catch((cause: unknown) => setError(errorMessage(cause)))
      .finally(() => setBusy(false))
  }

  // Fechar dentro do horário é uma decisão que vale até a próxima abertura;
  // fechar fora dele é só voltar ao normal, porque o normal já é fechado.
  const close = () =>
    run(scheduledOpen(now) ? { mode: 'closed', until: nextOpeningAt(now) } : noOverride)

  // O inverso: abrir dentro do horário é voltar ao normal; abrir fora dele
  // é uma decisão com hora para acabar.
  const open = () =>
    run(scheduledOpen(now) ? noOverride : { mode: 'open', until: manualOpenEndsAt(now) })

  return (
    <section
      aria-labelledby="store-status-title"
      className="mt-6 rounded-card border border-acai-100 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="store-status-title" className="text-sm font-extrabold text-ink">
            Pedidos no site
          </h2>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
              status.isOpen ? 'bg-green-50 text-green-700' : 'bg-acai-50 text-acai-800'
            }`}
          >
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${status.isOpen ? 'bg-green-600' : 'bg-acai-400'}`}
            />
            {status.label}
          </span>
        </div>

        {status.isOpen ? (
          <PrimaryButton onClick={close} disabled={busy}>
            {busy ? 'Salvando...' : 'Fechar os pedidos agora'}
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={open} disabled={busy}>
            {busy ? 'Salvando...' : openLabel(now, override)}
          </PrimaryButton>
        )}
      </div>

      <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted">{explanation(now, override)}</p>

      <ErrorNote message={error} />
    </section>
  )
}
