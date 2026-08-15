import { useEffect, useMemo, useState } from 'react'
import { formatPrice } from '../lib/order'
import type { Order, OrderStatus } from '../orders/types'
import { statusLabels } from '../orders/types'
import type { Period } from './metrics'
import { inPeriod, matchesSearch, sum } from './metrics'
import { OrderCard } from './OrderCard'
import { OrderRow } from './OrderRow'
import { PeriodFilter } from './PeriodFilter'

/**
 * Página de pedidos: a lista completa, separada por etapa, com busca,
 * período, ordem e dois modos de visualização.
 */

interface OrdersViewProps {
  readonly orders: readonly Order[]
  readonly onAdvance: (order: Order, status: OrderStatus) => void
  readonly onRemove: (id: string) => void
}

type Filter = OrderStatus | 'todos' | 'ativos'
type Layout = 'cards' | 'lista'
type Sort = 'antigos' | 'recentes'

const filters: readonly { readonly id: Filter; readonly label: string }[] = [
  { id: 'ativos', label: 'Em aberto' },
  { id: 'novo', label: 'Novos' },
  { id: 'preparando', label: 'Preparando' },
  { id: 'entrega', label: 'Em entrega' },
  { id: 'concluido', label: 'Concluídos' },
  { id: 'cancelado', label: 'Cancelados' },
  { id: 'todos', label: 'Todos' },
]

const allStages: readonly OrderStatus[] = [
  'novo',
  'preparando',
  'entrega',
  'concluido',
  'cancelado',
]

const stageDots: Readonly<Record<OrderStatus, string>> = {
  novo: 'bg-amber-500',
  preparando: 'bg-acai-500',
  entrega: 'bg-sky-500',
  concluido: 'bg-emerald-500',
  cancelado: 'bg-acai-200',
}

const stagesOf = (filter: Filter): readonly OrderStatus[] => {
  if (filter === 'todos') return allStages
  if (filter === 'ativos') return ['novo', 'preparando', 'entrega']
  return [filter]
}

/** Relógio compartilhado: um só intervalo alimenta o "há X min" de todos. */
const useNow = (intervalMs: number): number => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return now
}

export function OrdersView({ orders, onAdvance, onRemove }: OrdersViewProps) {
  const [filter, setFilter] = useState<Filter>('ativos')
  const [period, setPeriod] = useState<Period>({ id: 'tudo' })
  const [search, setSearch] = useState('')
  const [layout, setLayout] = useState<Layout>('cards')
  const [sort, setSort] = useState<Sort>('antigos')
  /** Pedido aberto em detalhe a partir da lista compacta. */
  const [opened, setOpened] = useState<string | null>(null)

  const now = useNow(30_000)
  const term = search.trim()

  const counts = useMemo(() => {
    const byStatus = (status: OrderStatus) => orders.filter((order) => order.status === status).length
    return {
      todos: orders.length,
      ativos: orders.filter((order) => order.status !== 'concluido' && order.status !== 'cancelado')
        .length,
      novo: byStatus('novo'),
      preparando: byStatus('preparando'),
      entrega: byStatus('entrega'),
      concluido: byStatus('concluido'),
      cancelado: byStatus('cancelado'),
    } satisfies Record<Filter, number>
  }, [orders])

  const visible = useMemo(() => {
    const stages = stagesOf(filter)
    return inPeriod(orders, period)
      .filter((order) => stages.includes(order.status) && matchesSearch(order, term))
      .slice()
      .sort((a, b) =>
        sort === 'antigos'
          ? a.createdAt.localeCompare(b.createdAt)
          : b.createdAt.localeCompare(a.createdAt),
      )
  }, [orders, filter, period, term, sort])

  const filtered = term !== '' || period.id !== 'tudo'

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Pedidos</h1>
          <p className="mt-1 text-sm text-muted">
            Separados por etapa. O relógio de cada pedido conta desde que ele entrou.
          </p>
        </div>

        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <SearchIcon />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por número, nome, telefone…"
            aria-label="Buscar pedidos"
            className="w-full rounded-full border border-acai-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-muted focus:border-acai-500"
          />
        </div>

        <Toggle
          label="Ordem"
          options={[
            { id: 'antigos', label: 'Mais antigos' },
            { id: 'recentes', label: 'Mais recentes' },
          ]}
          value={sort}
          onChange={setSort}
        />

        <Toggle
          label="Visualização"
          options={[
            { id: 'cards', label: 'Cartões' },
            { id: 'lista', label: 'Lista' },
          ]}
          value={layout}
          onChange={setLayout}
        />
      </div>

      <div
        role="group"
        aria-label="Filtrar por etapa"
        className="-mx-5 mt-3 flex gap-1.5 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-wrap lg:px-0"
      >
        {filters.map((item) => {
          const active = filter === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              aria-pressed={active}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
                active ? 'bg-acai-800 text-white' : 'bg-acai-50 text-acai-700 hover:bg-acai-100'
              }`}
            >
              {item.label}
              <span className={active ? 'text-acai-200' : 'text-muted'}>{counts[item.id]}</span>
            </button>
          )
        })}
      </div>

      {filtered && (
        <p className="mt-3 text-xs text-muted">
          {visible.length} {visible.length === 1 ? 'pedido encontrado' : 'pedidos encontrados'}
          {term !== '' && ` para "${term}"`}
          {(term !== '' || period.id !== 'tudo') && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setPeriod({ id: 'tudo' })
              }}
              className="ml-2 font-bold text-acai-700 underline underline-offset-2 hover:text-acai-900"
            >
              Limpar filtros
            </button>
          )}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="mt-6 rounded-card border border-dashed border-acai-200 p-10 text-center text-sm text-muted">
          {term !== ''
            ? `Nenhum pedido encontrado para "${term}".`
            : filter === 'ativos'
              ? 'Nenhum pedido em aberto agora. Os novos aparecem aqui sozinhos.'
              : 'Nenhum pedido nesse filtro.'}
        </p>
      ) : (
        stagesOf(filter).map((stage) => {
          const list = visible.filter((order) => order.status === stage)
          if (list.length === 0) return null

          return (
            <section key={stage} className="mt-7">
              <h2 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-extrabold uppercase tracking-[0.12em] text-muted">
                <span className={`size-2.5 rounded-full ${stageDots[stage]}`} aria-hidden="true" />
                {statusLabels[stage]}
                <span className="font-semibold normal-case tracking-normal">
                  {list.length} · {formatPrice(sum(list))}
                </span>
              </h2>

              {layout === 'lista' ? (
                <ul className="mt-2 rounded-card border border-acai-100 bg-white px-5 shadow-sm">
                  {list.map((order) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      now={now}
                      onAdvance={onAdvance}
                      onOpen={() => {
                        setOpened(order.id)
                        setLayout('cards')
                      }}
                    />
                  ))}
                </ul>
              ) : (
                <div className="mt-3 grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
                  {list.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      now={now}
                      highlight={opened === order.id}
                      onAdvance={onAdvance}
                      onCancel={(target) => onAdvance(target, 'cancelado')}
                      onRemove={onRemove}
                    />
                  ))}
                </div>
              )}
            </section>
          )
        })
      )}
    </>
  )
}

function Toggle<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  readonly label: string
  readonly options: readonly { readonly id: T; readonly label: string }[]
  readonly value: T
  readonly onChange: (value: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex shrink-0 gap-1 rounded-full bg-acai-50 p-1">
      {options.map((option) => {
        const active = value === option.id
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={active}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              active ? 'bg-white text-acai-900 shadow-sm' : 'text-acai-700 hover:text-acai-900'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 fill-muted"
    >
      <path d="M10.5 3a7.5 7.5 0 1 0 4.55 13.46l4.24 4.25a1 1 0 0 0 1.42-1.42l-4.25-4.24A7.5 7.5 0 0 0 10.5 3Zm0 2a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z" />
    </svg>
  )
}
