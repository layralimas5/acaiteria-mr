import { useState } from 'react'
import type { NewInventoryItem, Unit } from '../inventory/store'
import { categories, unitLabels } from '../inventory/store'

/** Ficha de cadastro de um insumo novo na despensa. */

interface NewSupplyFormProps {
  readonly onCreate: (item: NewInventoryItem) => void
  readonly onCancel: () => void
}

const units: readonly Unit[] = ['kg', 'g', 'l', 'ml', 'un', 'cx', 'pct']

const parseNumber = (value: string): number | null => {
  if (value.trim() === '') return 0
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

export function NewSupplyForm({ onCreate, onCancel }: NewSupplyFormProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState(categories[0] ?? 'Outros')
  const [unit, setUnit] = useState<Unit>('kg')
  const [quantity, setQuantity] = useState('')
  const [minQuantity, setMinQuantity] = useState('')
  const [error, setError] = useState('')

  const submit = (event: React.FormEvent) => {
    event.preventDefault()

    if (name.trim().length < 2) {
      setError('Dê um nome ao insumo.')
      return
    }

    const current = parseNumber(quantity)
    const min = parseNumber(minQuantity)
    if (current === null || min === null) {
      setError('Quantidades inválidas. Use apenas números, como 12 ou 2,5.')
      return
    }

    onCreate({
      name: name.trim(),
      category,
      unit,
      quantity: current,
      minQuantity: min,
    })
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 rounded-card border border-acai-200 bg-acai-50/60 p-5"
      aria-label="Novo insumo"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-xs font-bold text-ink">Nome</span>
          <input
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setError('')
            }}
            autoFocus
            placeholder="Polpa de açaí"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold text-ink">Categoria</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={inputClass}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-bold text-ink">Unidade</span>
          <select
            value={unit}
            onChange={(event) => setUnit(event.target.value as Unit)}
            className={inputClass}
          >
            {units.map((item) => (
              <option key={item} value={item}>
                {unitLabels[item]}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-[11px] text-muted">Como você conta esse item</span>
        </label>

        <label className="block">
          <span className="text-xs font-bold text-ink">Quantidade atual</span>
          <input
            value={quantity}
            onChange={(event) => {
              setQuantity(event.target.value)
              setError('')
            }}
            inputMode="decimal"
            placeholder="0"
            className={inputClass}
          />
          <span className="mt-1 block text-[11px] text-muted">O que tem hoje na despensa</span>
        </label>

        <label className="block">
          <span className="text-xs font-bold text-ink">Mínimo</span>
          <input
            value={minQuantity}
            onChange={(event) => {
              setMinQuantity(event.target.value)
              setError('')
            }}
            inputMode="decimal"
            placeholder="0"
            className={inputClass}
          />
          <span className="mt-1 block text-[11px] text-muted">
            Abaixo disso o painel pede reposição
          </span>
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
          Cadastrar insumo
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
