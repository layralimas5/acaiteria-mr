import { useState } from 'react'
import { productKinds, toppingCategories } from '../data/builder'
import type { ProductKindId, ToppingCategoryId } from '../data/builder'
import type { CustomKind, NewCustomItem } from '../stock/custom'
import { kindLabels } from '../stock/custom'

/** Ficha de cadastro de item novo do cardápio, direto pelo painel. */

interface NewItemFormProps {
  readonly onCreate: (item: NewCustomItem) => void
  readonly onCancel: () => void
}

const kinds: readonly CustomKind[] = ['topping', 'size', 'base']

/** Preço digitado como "8,50" ou "8.50". Vazio conta como zero. */
const parsePrice = (value: string): number | null => {
  if (value.trim() === '') return 0
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

export function NewItemForm({ onCreate, onCancel }: NewItemFormProps) {
  const [kind, setKind] = useState<CustomKind>('topping')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [emoji, setEmoji] = useState('')
  const [volume, setVolume] = useState('')
  const [description, setDescription] = useState('')
  const [freeToppings, setFreeToppings] = useState('3')
  const [productId, setProductId] = useState<ProductKindId>('acai')
  const [categoryId, setCategoryId] = useState<ToppingCategoryId>('frutas')
  const [error, setError] = useState('')

  const submit = (event: React.FormEvent) => {
    event.preventDefault()

    if (name.trim().length < 2) {
      setError('Dê um nome ao item.')
      return
    }

    const value = parsePrice(price)
    if (value === null) {
      setError('Preço inválido. Use apenas números, como 4,50.')
      return
    }

    if (kind === 'size' && volume.trim() === '') {
      setError('Informe o volume do tamanho, como 500ml.')
      return
    }

    const free = Number(freeToppings)
    if (kind === 'size' && (!Number.isInteger(free) || free < 0)) {
      setError('Complementos grátis deve ser um número inteiro.')
      return
    }

    onCreate({
      kind,
      name: name.trim(),
      price: value,
      visible: true,
      ...(kind === 'topping' && { categoryId, emoji: emoji.trim() || '✨' }),
      ...(kind === 'size' && { productId, volume: volume.trim(), freeToppings: free }),
      ...(kind === 'base' && { productId, description: description.trim() }),
    })
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 rounded-card border border-acai-200 bg-acai-50/60 p-5"
      aria-label="Novo item do cardápio"
    >
      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
          O que você vai cadastrar
        </legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {kinds.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setKind(item)
                setError('')
              }}
              aria-pressed={kind === item}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                kind === item ? 'bg-acai-800 text-white' : 'bg-white text-acai-700 hover:bg-acai-100'
              }`}
            >
              {kindLabels[item]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Nome" hint={kind === 'topping' ? 'Ex.: Morango' : 'Ex.: Copo 700ml'}>
          <input
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setError('')
            }}
            autoFocus
            className={inputClass}
          />
        </Field>

        <Field
          label={kind === 'size' ? 'Preço do tamanho' : 'Preço do adicional'}
          hint={kind === 'size' ? 'Valor cheio do copo' : 'Deixe 0 para item sem custo'}
        >
          <input
            value={price}
            onChange={(event) => {
              setPrice(event.target.value)
              setError('')
            }}
            inputMode="decimal"
            placeholder="0,00"
            className={inputClass}
          />
        </Field>

        {kind === 'topping' && (
          <>
            <Field label="Categoria" hint="Onde ele aparece no montador">
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value as ToppingCategoryId)}
                className={inputClass}
              >
                {toppingCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Emoji" hint="Usado enquanto não há foto">
              <input
                value={emoji}
                onChange={(event) => setEmoji(event.target.value)}
                placeholder="🍓"
                maxLength={4}
                className={inputClass}
              />
            </Field>
          </>
        )}

        {kind !== 'topping' && (
          <Field label="Produto" hint="A qual produto ele pertence">
            <select
              value={productId}
              onChange={(event) => setProductId(event.target.value as ProductKindId)}
              className={inputClass}
            >
              {productKinds.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        {kind === 'size' && (
          <>
            <Field label="Volume" hint="Ex.: 700ml">
              <input
                value={volume}
                onChange={(event) => {
                  setVolume(event.target.value)
                  setError('')
                }}
                className={inputClass}
              />
            </Field>

            <Field label="Complementos grátis" hint="Quantos saem sem custo nesse tamanho">
              <input
                value={freeToppings}
                onChange={(event) => setFreeToppings(event.target.value)}
                inputMode="numeric"
                className={inputClass}
              />
            </Field>
          </>
        )}

        {kind === 'base' && (
          <Field label="Descrição" hint="Aparece embaixo do nome">
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Cremoso e tradicional"
              className={inputClass}
            />
          </Field>
        )}
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
          Cadastrar e publicar no site
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

function Field({
  label,
  hint,
  children,
}: {
  readonly label: string
  readonly hint: string
  readonly children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-ink">{label}</span>
      {children}
      <span className="mt-1 block text-[11px] text-muted">{hint}</span>
    </label>
  )
}
