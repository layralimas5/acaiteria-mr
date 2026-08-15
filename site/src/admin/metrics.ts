import type { Order, PaymentMethod } from '../orders/types'

/**
 * Contas do painel. Ficam fora dos componentes para que o dashboard e o
 * financeiro leiam exatamente os mesmos números.
 */

export type PeriodId = 'hoje' | 'ontem' | 'semana' | 'mes' | 'custom' | 'tudo'

/** Período escolhido no painel. `from`/`to` são datas `yyyy-mm-dd`. */
export interface Period {
  readonly id: PeriodId
  readonly from?: string
  readonly to?: string
}

export const periods: readonly { readonly id: PeriodId; readonly label: string }[] = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'ontem', label: 'Ontem' },
  { id: 'semana', label: '7 dias' },
  { id: 'mes', label: '30 dias' },
  { id: 'custom', label: 'Escolher datas' },
  { id: 'tudo', label: 'Tudo' },
]

export const paymentOrder: readonly PaymentMethod[] = ['pix', 'dinheiro', 'cartao']

/** Começo do dia, N dias atrás. `startOfDay(0)` é a meia-noite de hoje. */
export const startOfDay = (daysAgo: number): Date => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(0, 0, 0, 0)
  return date
}

/** Data local no formato `yyyy-mm-dd`, que é o que o input date usa. */
export const toDateInput = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

const fromDateInput = (value: string, nextDay = false): Date | null => {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day + (nextDay ? 1 : 0))
}

export interface DateRange {
  readonly start: Date | null
  /** Limite superior exclusivo. `null` significa "até agora". */
  readonly end: Date | null
}

/** Intervalo de datas do período. `null` nas pontas significa sem limite. */
export const rangeOf = (period: Period): DateRange => {
  switch (period.id) {
    case 'hoje':
      return { start: startOfDay(0), end: null }
    case 'ontem':
      return { start: startOfDay(1), end: startOfDay(0) }
    case 'semana':
      return { start: startOfDay(6), end: null }
    case 'mes':
      return { start: startOfDay(29), end: null }
    case 'custom':
      return {
        start: period.from ? fromDateInput(period.from) : null,
        end: period.to ? fromDateInput(period.to, true) : null,
      }
    case 'tudo':
      return { start: null, end: null }
  }
}

const shortDate = (date: Date): string =>
  date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

/** Texto do intervalo, para mostrar embaixo do filtro. */
export const periodLabel = (period: Period): string => {
  if (period.id === 'tudo') return 'Desde o primeiro pedido'
  if (period.id === 'hoje') return new Date().toLocaleDateString('pt-BR', { dateStyle: 'long' })

  if (period.id === 'custom') {
    const start = period.from ? fromDateInput(period.from) : null
    const end = period.to ? fromDateInput(period.to) : null
    if (!start && !end) return 'Escolha as datas'
    if (start && end) return `${shortDate(start)} até ${shortDate(end)}`
    if (start) return `A partir de ${shortDate(start)}`
    return `Até ${shortDate(end as Date)}`
  }

  const { start } = rangeOf(period)
  if (!start) return ''
  if (period.id === 'ontem') return start.toLocaleDateString('pt-BR', { dateStyle: 'long' })
  return `${shortDate(start)} até ${shortDate(new Date())}`
}

/** true quando a data cai dentro do período. */
export const isInPeriod = (iso: string, period: Period): boolean => {
  const { start, end } = rangeOf(period)
  const date = new Date(iso)
  if (start && date < start) return false
  if (end && date >= end) return false
  return true
}

export const sum = (orders: readonly Order[]): number =>
  orders.reduce((total, order) => total + order.total, 0)

/** Pedido que ainda está na operação: nem entregue, nem cancelado. */
export const isOpen = (order: Order): boolean =>
  order.status !== 'concluido' && order.status !== 'cancelado'

export const inPeriod = (orders: readonly Order[], period: Period): readonly Order[] =>
  period.id === 'tudo' ? orders : orders.filter((order) => isInPeriod(order.createdAt, period))

export interface MoneySummary {
  readonly faturamento: number
  /** Já entregue, ou seja, dinheiro em caixa. */
  readonly recebido: number
  readonly aReceber: number
  readonly ticket: number
  readonly perdido: number
}

export const moneyOf = (orders: readonly Order[]): MoneySummary => {
  const validos = orders.filter((order) => order.status !== 'cancelado')
  const faturamento = sum(validos)
  const recebido = sum(orders.filter((order) => order.status === 'concluido'))

  return {
    faturamento,
    recebido,
    aReceber: faturamento - recebido,
    ticket: validos.length > 0 ? faturamento / validos.length : 0,
    perdido: sum(orders.filter((order) => order.status === 'cancelado')),
  }
}

export interface PaymentSummary {
  readonly method: PaymentMethod
  readonly count: number
  readonly valor: number
  /** Participação no faturamento, em porcentagem inteira. */
  readonly share: number
}

export const paymentsOf = (orders: readonly Order[]): readonly PaymentSummary[] => {
  const validos = orders.filter((order) => order.status !== 'cancelado')
  const total = sum(validos)

  return paymentOrder.map((method) => {
    const doMetodo = validos.filter((order) => order.customer.payment === method)
    const valor = sum(doMetodo)
    return {
      method,
      count: doMetodo.length,
      valor,
      share: total > 0 ? Math.round((valor / total) * 100) : 0,
    }
  })
}

export interface DaySummary {
  readonly key: string
  readonly label: string
  readonly count: number
  readonly total: number
}

/** Faturamento dia a dia, do mais recente para o mais antigo. */
export const byDay = (orders: readonly Order[]): readonly DaySummary[] => {
  const days = new Map<string, { count: number; total: number; date: Date }>()

  for (const order of orders) {
    if (order.status === 'cancelado') continue
    const date = new Date(order.createdAt)
    date.setHours(0, 0, 0, 0)
    const key = date.toISOString().slice(0, 10)
    const current = days.get(key) ?? { count: 0, total: 0, date }
    days.set(key, { count: current.count + 1, total: current.total + order.total, date })
  }

  return [...days.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, value]) => ({
      key,
      label: value.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      count: value.count,
      total: value.total,
    }))
}

export const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

export const minutesSince = (iso: string, now: number): number =>
  Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000))

/** "há 8 min", "há 1h20". Usado para saber quanto o cliente já esperou. */
export const waitLabel = (minutes: number): string => {
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `há ${minutes} min`
  return `há ${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}`
}

/** Texto sem acento e em minúsculas, para a busca não depender de digitação. */
export const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

/**
 * Busca por número, cliente, telefone ou endereço. Cada palavra digitada
 * precisa aparecer, em qualquer ordem, e acento não atrapalha.
 */
export const matchesSearch = (order: Order, term: string): boolean => {
  const words = normalize(term).split(/\s+/).filter(Boolean)
  if (words.length === 0) return true

  const haystack = normalize(
    [
      order.code,
      order.customer.name,
      order.customer.phone,
      order.customer.phone.replace(/\D/g, ''),
      order.customer.address,
      order.customer.reference,
    ].join(' '),
  )

  return words.every((word) => haystack.includes(word))
}
