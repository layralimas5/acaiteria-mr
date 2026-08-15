import { useState } from 'react'
import type { EntryType, NewFinanceEntry } from '../finance/store'
import { entryCategories } from '../finance/store'
import { toDateInput } from './metrics'

/** Ficha de lançamento no caixa: uma entrada ou uma saída. */

interface EntryFormProps {
  readonly onSave: (entry: NewFinanceEntry) => void
  readonly onCancel: () => void
}

const types: readonly { readonly id: EntryType; readonly label: string }[] = [
  { id: 'saida', label: 'Saída' },
  { id: 'entrada', label: 'Entrada' },
]

/** Valor digitado como "8,50" ou "8.50". */
const parseAmount = (value: string): number | null => {
  const parsed = Number(value.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function EntryForm({ onSave, onCancel }: EntryFormProps) {
  const today = toDateInput(new Date())
  const [type, setType] = useState<EntryType>('saida')
  const [date, setDate] = useState(today)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(entryCategories.saida[0] ?? 'Outros')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  const changeType = (next: EntryType) => {
    setType(next)
    setCategory(entryCategories[next][0] ?? 'Outros')
    setError('')
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()

    if (description.trim().length < 2) {
      setError('Descreva o lançamento.')
      return
    }

    const value = parseAmount(amount)
    if (value === null) {
      setError('Informe um valor maior que zero, como 45,90.')
      return
    }

    if (!date) {
      setError('Escolha a data do lançamento.')
      return
    }

    onSave({ type, date, description: description.trim(), category, amount: value })
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 rounded-card border border-acai-200 bg-acai-50/60 p-5"
      aria-label="Novo lançamento no caixa"
    >
      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
          Tipo de lançamento
        </legend>
        <div className="mt-2 flex gap-1.5">
          {types.map((item) => {
            const active = type === item.id
            const tone =
              item.id === 'entrada'
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 text-white'
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => changeType(item.id)}
                aria-pressed={active}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                  active ? tone : 'bg-white text-acai-700 hover:bg-acai-100'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-xs font-bold text-ink">Descrição</span>
          <input
            value={description}
            onChange={(event) => {
              setDescription(event.target.value)
              setError('')
            }}
            autoFocus
            placeholder={type === 'saida' ? 'Compra de polpa de açaí' : 'Venda no balcão'}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold text-ink">Valor</span>
          <input
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value)
              setError('')
            }}
            inputMode="decimal"
            placeholder="0,00"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold text-ink">Data</span>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(event) => {
              setDate(event.target.value)
              setError('')
            }}
            className={inputClass}
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="text-xs font-bold text-ink">Categoria</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={inputClass}
          >
            {entryCategories[type].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs font-bold text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-full bg-acai-800 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-acai-900"
        >
          Salvar lançamento
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-4 py-2.5 text-xs font-bold text-muted transition-colors hover:text-acai-800"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

const inputClass =
  'mt-1 w-full rounded-xl border border-acai-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-acai-500'
