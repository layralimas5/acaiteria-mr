import type { Period } from './metrics'
import { periodLabel, periods, startOfDay, toDateInput } from './metrics'

/**
 * Filtro de período do painel. Os atalhos cobrem o dia a dia; "Escolher datas"
 * abre o intervalo livre para fechamento de mês ou conferência de um dia solto.
 */

interface PeriodFilterProps {
  readonly value: Period
  readonly onChange: (period: Period) => void
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  const today = toDateInput(new Date())
  const custom = value.id === 'custom'

  const select = (id: Period['id']) => {
    if (id !== 'custom') {
      onChange({ id })
      return
    }
    // Ao abrir o intervalo livre, começa na última semana para não vir vazio.
    onChange({ id: 'custom', from: value.from ?? toDateInput(startOfDay(6)), to: value.to ?? today })
  }

  return (
    <div className="w-full lg:w-auto">
      <div
        role="group"
        aria-label="Período"
        className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-wrap lg:justify-end lg:px-0"
      >
        {periods.map((item) => {
          const active = value.id === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => select(item.id)}
              aria-pressed={active}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                active ? 'bg-acai-800 text-white' : 'bg-acai-50 text-acai-700 hover:bg-acai-100'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {custom && (
        <div className="mt-2 flex flex-wrap items-end gap-2 lg:justify-end">
          <label className="min-w-0">
            <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              De
            </span>
            <input
              type="date"
              value={value.from ?? ''}
              max={value.to ?? today}
              onChange={(event) => onChange({ ...value, from: event.target.value })}
              className="mt-1 rounded-xl border border-acai-200 px-3 py-1.5 text-sm text-ink outline-none focus:border-acai-500"
            />
          </label>
          <label className="min-w-0">
            <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              Até
            </span>
            <input
              type="date"
              value={value.to ?? ''}
              min={value.from}
              max={today}
              onChange={(event) => onChange({ ...value, to: event.target.value })}
              className="mt-1 rounded-xl border border-acai-200 px-3 py-1.5 text-sm text-ink outline-none focus:border-acai-500"
            />
          </label>
        </div>
      )}

      <p className="mt-2 text-xs text-muted lg:text-right">{periodLabel(value)}</p>
    </div>
  )
}
