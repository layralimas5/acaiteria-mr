import { useState } from 'react'
import type { InventoryItem, MovementType, NewMovement } from '../inventory/store'
import { movementReasons, unitLabels } from '../inventory/store'

/** Ficha de entrada ou saída de um insumo. */

interface MovementFormProps {
  readonly item: InventoryItem
  readonly onSave: (movement: NewMovement, alsoInFinance: boolean) => void
  readonly onCancel: () => void
}

const parseNumber = (value: string): number | null => {
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function MovementForm({ item, onSave, onCancel }: MovementFormProps) {
  const [type, setType] = useState<MovementType>('entrada')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState(movementReasons.entrada[0] ?? 'Compra')
  const [cost, setCost] = useState('')
  const [inFinance, setInFinance] = useState(true)
  const [error, setError] = useState('')

  const changeType = (next: MovementType) => {
    setType(next)
    setReason(movementReasons[next][0] ?? '')
    setError('')
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()

    const value = parseNumber(quantity)
    if (value === null) {
      setError('Informe uma quantidade maior que zero.')
      return
    }

    if (type === 'saida' && value > item.quantity) {
      setError(
        `Só há ${item.quantity} ${unitLabels[item.unit]} em estoque. Ajuste a contagem antes de dar saída.`,
      )
      return
    }

    const typed = cost.trim() !== ''
    const paid = typed ? parseNumber(cost) : null
    if (typed && paid === null) {
      setError('Valor inválido. Use apenas números, como 89,90.')
      return
    }

    onSave(
      { itemId: item.id, type, quantity: value, reason, ...(paid !== null && { cost: paid }) },
      type === 'entrada' && paid !== null && inFinance,
    )
  }

  return (
    <form
      onSubmit={submit}
      className="mt-3 rounded-2xl border border-acai-200 bg-acai-50/60 p-4"
      aria-label={`Movimentar ${item.name}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-extrabold text-ink">{item.name}</p>
        <p className="text-xs text-muted">
          Saldo atual: <span className="font-bold text-ink">{item.quantity}</span>{' '}
          {unitLabels[item.unit]}
        </p>
      </div>

      <div className="mt-3 flex gap-1.5">
        {(['entrada', 'saida'] as const).map((option) => {
          const active = type === option
          const tone = option === 'entrada' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          return (
            <button
              key={option}
              type="button"
              onClick={() => changeType(option)}
              aria-pressed={active}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                active ? tone : 'bg-white text-acai-700 hover:bg-acai-100'
              }`}
            >
              {option === 'entrada' ? 'Entrada' : 'Saída'}
            </button>
          )
        })}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs font-bold text-ink">
            Quantidade ({unitLabels[item.unit]})
          </span>
          <input
            value={quantity}
            onChange={(event) => {
              setQuantity(event.target.value)
              setError('')
            }}
            autoFocus
            inputMode="decimal"
            placeholder="0"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold text-ink">Motivo</span>
          <select
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className={inputClass}
          >
            {movementReasons[type].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        {type === 'entrada' && (
          <label className="block">
            <span className="text-xs font-bold text-ink">Quanto custou</span>
            <input
              value={cost}
              onChange={(event) => {
                setCost(event.target.value)
                setError('')
              }}
              inputMode="decimal"
              placeholder="opcional"
              className={inputClass}
            />
          </label>
        )}
      </div>

      {type === 'entrada' && cost.trim() !== '' && (
        <label className="mt-3 flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={inFinance}
            onChange={(event) => setInFinance(event.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-acai-800"
          />
          <span className="text-xs leading-relaxed text-muted">
            Lançar também como <span className="font-bold text-ink">saída no caixa</span>, na
            categoria Insumos. Assim a compra aparece no financeiro sem digitar de novo.
          </span>
        </label>
      )}

      {error && (
        <p role="alert" className="mt-3 text-xs font-bold text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-full bg-acai-800 px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-acai-900"
        >
          Registrar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-4 py-2 text-xs font-bold text-muted transition-colors hover:text-acai-800"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

const inputClass =
  'mt-1 w-full rounded-xl border border-acai-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-acai-500'
