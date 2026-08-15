import { useEffect, useMemo, useState } from 'react'
import { formatPrice } from '../lib/order'
import type { FinanceEntry } from '../finance/store'
import { addEntry, listEntries, removeEntry, subscribeToEntries } from '../finance/store'
import type { Order, PaymentMethod } from '../orders/types'
import { paymentLabels, statusLabels } from '../orders/types'
import { EntryForm } from './EntryForm'
import type { Period } from './metrics'
import { byDay, formatTime, inPeriod, isInPeriod, moneyOf, paymentsOf } from './metrics'
import { PeriodFilter } from './PeriodFilter'

/** Financeiro: as vendas do site, o caixa manual e o resultado dos dois. */

interface FinanceViewProps {
  readonly orders: readonly Order[]
}

const paymentBars: Readonly<Record<PaymentMethod, string>> = {
  pix: 'bg-emerald-500',
  dinheiro: 'bg-amber-500',
  cartao: 'bg-sky-500',
}

const sumEntries = (entries: readonly FinanceEntry[]): number =>
  entries.reduce((total, entry) => total + entry.amount, 0)

const formatDate = (date: string): string => {
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return date
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

export function FinanceView({ orders }: FinanceViewProps) {
  const [period, setPeriod] = useState<Period>({ id: 'semana' })
  const [entries, setEntries] = useState<readonly FinanceEntry[]>([])
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const sync = () => setEntries(listEntries())
    sync()
    return subscribeToEntries(sync)
  }, [])

  const scoped = useMemo(() => inPeriod(orders, period), [orders, period])
  const money = useMemo(() => moneyOf(scoped), [scoped])
  const payments = useMemo(() => paymentsOf(scoped), [scoped])
  const days = useMemo(() => byDay(scoped), [scoped])

  const scopedEntries = useMemo(
    () => entries.filter((entry) => isInPeriod(`${entry.date}T12:00:00`, period)),
    [entries, period],
  )

  const caixa = useMemo(() => {
    const entradas = sumEntries(scopedEntries.filter((entry) => entry.type === 'entrada'))
    const saidas = sumEntries(scopedEntries.filter((entry) => entry.type === 'saida'))
    return {
      entradas,
      saidas,
      /** Vendas já entregues + entradas manuais − saídas. */
      resultado: money.recebido + entradas - saidas,
    }
  }, [scopedEntries, money.recebido])

  const recent = useMemo(
    () => scoped.filter((order) => order.status !== 'cancelado').slice(0, 20),
    [scoped],
  )

  const best = days.reduce((max, day) => Math.max(max, day.total), 0)

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Financeiro</h1>
          <p className="mt-1 text-sm text-muted">
            Vendas do site mais o caixa da loja. Cancelados ficam de fora.
          </p>
        </div>

        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      <section aria-label="Resultado" className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Money
          label="Entradas"
          value={money.recebido + caixa.entradas}
          accent="text-emerald-600"
          hint={`${formatPrice(money.recebido)} em vendas entregues`}
        />
        <Money
          label="Saídas"
          value={caixa.saidas}
          accent="text-red-600"
          hint="Lançamentos do caixa"
        />
        <Money
          label="Resultado"
          value={caixa.resultado}
          accent={caixa.resultado < 0 ? 'text-red-600' : 'text-acai-800'}
          hint="Entradas menos saídas"
        />
        <Money
          label="A receber"
          value={money.aReceber}
          accent="text-amber-600"
          hint="Pedidos ainda em aberto"
        />
      </section>

      <section className="mt-6 rounded-card border border-acai-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold text-ink">Caixa</h2>
            <p className="mt-0.5 text-xs text-muted">
              O que o sistema não vê sozinho: compra de insumo, aluguel, venda no balcão.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAdding((value) => !value)}
            aria-expanded={adding}
            className="rounded-full bg-acai-800 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-acai-900"
          >
            {adding ? 'Fechar ficha' : '+ Novo lançamento'}
          </button>
        </div>

        {adding && (
          <EntryForm
            onSave={(draft) => {
              addEntry(draft)
              setAdding(false)
            }}
            onCancel={() => setAdding(false)}
          />
        )}

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Chip label="Entradas no caixa" value={caixa.entradas} accent="text-emerald-700" />
          <Chip label="Saídas no caixa" value={caixa.saidas} accent="text-red-700" />
          <Chip
            label="Saldo do caixa"
            value={caixa.entradas - caixa.saidas}
            accent="text-acai-800"
          />
        </div>

        {scopedEntries.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-acai-200 p-8 text-center text-sm text-muted">
            Nenhum lançamento no período. Use a ficha acima para registrar o primeiro.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-acai-100">
            {scopedEntries.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 py-2.5">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-extrabold ${
                    entry.type === 'entrada'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                  aria-hidden="true"
                >
                  {entry.type === 'entrada' ? '+' : '−'}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{entry.description}</p>
                  <p className="truncate text-xs text-muted">
                    {formatDate(entry.date)} · {entry.category}
                  </p>
                </div>

                <span
                  className={`shrink-0 text-sm font-extrabold ${
                    entry.type === 'entrada' ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {entry.type === 'entrada' ? '+' : '−'} {formatPrice(entry.amount)}
                </span>

                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  aria-label={`Excluir lançamento ${entry.description}`}
                  className="shrink-0 rounded-full p-1.5 text-muted transition-colors hover:bg-acai-50 hover:text-red-700"
                >
                  <TrashIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-card border border-acai-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-extrabold text-ink">Formas de pagamento</h2>

          {money.faturamento === 0 ? (
            <p className="mt-4 text-sm text-muted">Nenhum pedido no período.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {payments.map((item) => (
                <li key={item.method}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-bold text-ink">{paymentLabels[item.method]}</span>
                    <span className="text-muted">
                      <span className="font-extrabold text-ink">{formatPrice(item.valor)}</span>
                      {' · '}
                      {item.share}%
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-2 overflow-hidden rounded-full bg-acai-100"
                    role="img"
                    aria-label={`${paymentLabels[item.method]}: ${item.share}% do faturamento`}
                  >
                    <div
                      className={`h-full rounded-full transition-[width] ${paymentBars[item.method]}`}
                      style={{ width: `${item.share}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {item.count} {item.count === 1 ? 'pedido' : 'pedidos'}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {money.perdido > 0 && (
            <p className="mt-5 border-t border-acai-100 pt-4 text-xs text-muted">
              Cancelados no período: <span className="font-bold">{formatPrice(money.perdido)}</span>
            </p>
          )}
        </section>

        <section className="rounded-card border border-acai-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-extrabold text-ink">Vendas por dia</h2>

          {days.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Nenhum pedido no período.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {days.map((day) => (
                <li key={day.key}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-bold text-ink">{day.label}</span>
                    <span className="text-muted">
                      <span className="font-extrabold text-ink">{formatPrice(day.total)}</span>
                      {' · '}
                      {day.count} {day.count === 1 ? 'pedido' : 'pedidos'}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-acai-100">
                    <div
                      className="h-full rounded-full bg-acai-500 transition-[width]"
                      style={{ width: `${best > 0 ? (day.total / best) * 100 : 0}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-card border border-acai-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-ink">
          Últimos pedidos
          <span className="ml-2 text-xs font-semibold text-muted">{recent.length}</span>
        </h2>

        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Nenhum pedido no período.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead>
                <tr className="border-b border-acai-100 text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="py-2 pr-3 font-bold">Pedido</th>
                  <th scope="col" className="py-2 pr-3 font-bold">Cliente</th>
                  <th scope="col" className="py-2 pr-3 font-bold">Pagamento</th>
                  <th scope="col" className="py-2 pr-3 font-bold">Situação</th>
                  <th scope="col" className="py-2 text-right font-bold">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-acai-100">
                {recent.map((order) => (
                  <tr key={order.id}>
                    <td className="py-2.5 pr-3">
                      <span className="font-bold text-ink">#{order.code}</span>
                      <span className="ml-2 text-xs text-muted">{formatTime(order.createdAt)}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-muted">{order.customer.name}</td>
                    <td className="py-2.5 pr-3 text-muted">{paymentLabels[order.customer.payment]}</td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          order.status === 'concluido'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.status === 'concluido' ? 'Recebido' : 'A receber'}
                      </span>
                      <span className="ml-2 text-xs text-muted">{statusLabels[order.status]}</span>
                    </td>
                    <td className="py-2.5 text-right font-extrabold text-ink">
                      {formatPrice(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}

function Money({
  label,
  value,
  accent,
  hint,
}: {
  readonly label: string
  readonly value: number
  readonly accent: string
  readonly hint?: string
}) {
  return (
    <article className="rounded-card border border-acai-100 bg-white p-5 shadow-sm transition duration-200 hover:border-acai-200 hover:shadow-md motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.02]">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-extrabold tracking-tight ${accent}`}>{formatPrice(value)}</p>
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </article>
  )
}

function Chip({
  label,
  value,
  accent,
}: {
  readonly label: string
  readonly value: number
  readonly accent: string
}) {
  return (
    <div className="rounded-2xl bg-acai-50 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className={`mt-1 text-lg font-extrabold ${accent}`}>{formatPrice(value)}</p>
    </div>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
      <path d="M9 3a1 1 0 0 0-1 1v1H5a1 1 0 0 0 0 2h14a1 1 0 1 0 0-2h-3V4a1 1 0 0 0-1-1H9Zm-2.6 6 .8 10.2A2 2 0 0 0 9.2 21h5.6a2 2 0 0 0 2-1.8L17.6 9H6.4Zm3.6 2a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1Zm4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1Z" />
    </svg>
  )
}
