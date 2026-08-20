import { useState } from 'react'
import {
  createTopping,
  deleteCategory,
  deleteTopping,
  swapOrder,
  updateCategory,
  updateTopping,
} from '../../catalog/api'
import { suggestEmoji } from '../../catalog/emoji'
import type { Topping, ToppingCategory } from '../../catalog/types'
import { formatPrice } from '../../lib/order'
import {
  AvailableSwitch,
  DownIcon,
  Field,
  GhostButton,
  IconButton,
  NumberField,
  PencilIcon,
  PrimaryButton,
  TrashIcon,
  UpIcon,
} from './ui'

/**
 * Uma categoria de complemento (frutas, cremes, caldas) com os itens dela.
 *
 * A cota grátis e o teto de escolha são da categoria, não do complemento: é
 * assim que a loja explica no balcão ("3 frutas grátis, caldas no máximo 2").
 */

interface CategoryEditorProps {
  readonly category: ToppingCategory
  readonly siblings: readonly ToppingCategory[]
  readonly toppings: readonly Topping[]
  readonly run: (action: () => Promise<void>) => void
  readonly busy: boolean
}

export function CategoryEditor({
  category,
  siblings,
  toppings,
  run,
  busy,
}: CategoryEditorProps) {
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const index = siblings.findIndex((item) => item.id === category.id)
  const previous = siblings[index - 1]
  const next = siblings[index + 1]

  const quota = [
    category.rule.free > 0 ? `${category.rule.free} grátis` : 'nenhum grátis',
    category.rule.max === null ? 'sem limite' : `máx. ${category.rule.max}`,
  ].join(' · ')

  return (
    <article className="rounded-card border border-acai-100 bg-white shadow-sm">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 p-4">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-extrabold text-ink">{category.title}</span>
          <span className="block truncate text-xs text-muted">
            {quota} · {toppings.length} {toppings.length === 1 ? 'item' : 'itens'}
          </span>
        </span>

        <div className="flex items-center gap-1">
          <IconButton
            label="Subir"
            disabled={busy || !previous}
            onClick={() => previous && run(() => swapOrder('topping_categories', category, previous))}
          >
            <UpIcon />
          </IconButton>
          <IconButton
            label="Descer"
            disabled={busy || !next}
            onClick={() => next && run(() => swapOrder('topping_categories', category, next))}
          >
            <DownIcon />
          </IconButton>
          <IconButton label="Editar categoria" disabled={busy} onClick={() => setEditing((v) => !v)}>
            <PencilIcon />
          </IconButton>
          <IconButton
            label="Apagar categoria"
            disabled={busy}
            onClick={() => {
              const message = `Apagar a categoria "${category.title}"? Os ${toppings.length} complementos dela também somem.`
              if (window.confirm(message)) run(() => deleteCategory(category.id))
            }}
          >
            <TrashIcon />
          </IconButton>
        </div>
      </header>

      {editing && (
        <CategoryForm
          category={category}
          onCancel={() => setEditing(false)}
          onSave={(values) => {
            run(() => updateCategory(category.id, values))
            setEditing(false)
          }}
        />
      )}

      <div className="border-t border-acai-100 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Complementos</h3>
          <GhostButton onClick={() => setAdding((value) => !value)}>
            {adding ? 'Fechar' : '+ Novo complemento'}
          </GhostButton>
        </div>

        {toppings.length === 0 && !adding && (
          <p className="mt-2 rounded-2xl bg-acai-50 px-4 py-3 text-xs font-semibold text-muted">
            Categoria vazia. Ela só aparece no site quando tiver pelo menos um complemento.
          </p>
        )}

        <ul className="mt-2 space-y-2">
          {toppings.map((topping, position) => {
            const before = toppings[position - 1]
            const after = toppings[position + 1]

            return (
              <li key={topping.id} className="rounded-2xl border border-acai-100">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">
                      {topping.emoji} {topping.name}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {topping.price > 0
                        ? `+ ${formatPrice(topping.price)} depois da cota grátis`
                        : 'Sem custo extra'}
                    </span>
                  </span>

                  <AvailableSwitch
                    checked={topping.available}
                    onChange={(available) => run(() => updateTopping(topping.id, { available }))}
                    label={topping.available ? 'No site' : 'Acabou'}
                  />

                  <div className="flex items-center gap-1">
                    <IconButton
                      label="Subir"
                      disabled={busy || !before}
                      onClick={() => before && run(() => swapOrder('toppings', topping, before))}
                    >
                      <UpIcon />
                    </IconButton>
                    <IconButton
                      label="Descer"
                      disabled={busy || !after}
                      onClick={() => after && run(() => swapOrder('toppings', topping, after))}
                    >
                      <DownIcon />
                    </IconButton>
                    <IconButton
                      label="Editar complemento"
                      disabled={busy}
                      onClick={() => setEditingId(editingId === topping.id ? null : topping.id)}
                    >
                      <PencilIcon />
                    </IconButton>
                    <IconButton
                      label="Apagar complemento"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm(`Apagar "${topping.name}"?`)) {
                          run(() => deleteTopping(topping.id))
                        }
                      }}
                    >
                      <TrashIcon />
                    </IconButton>
                  </div>
                </div>

                {editingId === topping.id && (
                  <ToppingForm
                    topping={topping}
                    categoryTitle={category.title}
                    onCancel={() => setEditingId(null)}
                    onSave={(values) => {
                      run(() => updateTopping(topping.id, values))
                      setEditingId(null)
                    }}
                  />
                )}
              </li>
            )
          })}
        </ul>

        {adding && (
          <div className="mt-2 rounded-2xl border border-acai-200">
            <ToppingForm
              categoryTitle={category.title}
              onCancel={() => setAdding(false)}
              onSave={(values) => {
                run(() => createTopping(category.id, values, toppings))
                setAdding(false)
              }}
            />
          </div>
        )}
      </div>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Categoria
// ---------------------------------------------------------------------------

export interface CategoryValues {
  readonly title: string
  readonly subtitle: string
  readonly free: number
  readonly max: number | null
}

export const emptyCategory: CategoryValues = { title: '', subtitle: '', free: 0, max: null }

export function CategoryForm({
  category,
  onSave,
  onCancel,
}: {
  readonly category?: ToppingCategory
  readonly onSave: (values: CategoryValues) => void
  readonly onCancel: () => void
}) {
  const [values, setValues] = useState<CategoryValues>(
    category
      ? {
          title: category.title,
          subtitle: category.subtitle,
          free: category.rule.free,
          max: category.rule.max,
        }
      : emptyCategory,
  )

  const set = <K extends keyof CategoryValues>(key: K, value: CategoryValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }))

  const limited = values.max !== null
  // Teto abaixo da cota grátis é uma regra impossível de cumprir, e o banco recusa.
  const invalid = values.title.trim() === '' || (limited && values.max !== null && values.free > values.max)

  return (
    <div className="border-t border-acai-100 bg-acai-50/50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Nome da categoria"
          required
          value={values.title}
          onChange={(value) => set('title', value)}
          placeholder="Frutas"
        />
        <Field
          label="Linha de apoio"
          value={values.subtitle}
          onChange={(value) => set('subtitle', value)}
          placeholder="Fresquinhas, cortadas na hora"
        />
        <NumberField
          label="Quantos vêm grátis"
          value={values.free}
          onChange={(value) => set('free', Math.max(0, Math.trunc(value)))}
          step={1}
          max={20}
          hint="Já inclusos no preço do copo"
        />
        <div>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={limited}
              onChange={(event) => set('max', event.target.checked ? Math.max(values.free, 1) : null)}
              className="size-4 shrink-0 accent-acai-800"
            />
            <span className="text-xs font-bold text-acai-700">Limitar quantos cabem</span>
          </label>

          {limited && (
            <NumberField
              label="Máximo por copo"
              value={values.max ?? 0}
              onChange={(value) => set('max', Math.max(0, Math.trunc(value)))}
              step={1}
              max={20}
              className="mt-2"
            />
          )}
        </div>
      </div>

      {limited && values.max !== null && values.free > values.max && (
        <p role="alert" className="mt-3 text-xs font-semibold text-red-700">
          O máximo não pode ser menor que a quantidade grátis.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <PrimaryButton onClick={() => onSave(values)} disabled={invalid}>
          Salvar
        </PrimaryButton>
        <GhostButton onClick={onCancel}>Cancelar</GhostButton>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Complemento
// ---------------------------------------------------------------------------

interface ToppingValues {
  readonly name: string
  readonly price: number
  readonly emoji: string
  readonly image: string
}

const emptyTopping: ToppingValues = { name: '', price: 0, emoji: '', image: '' }

function ToppingForm({
  topping,
  categoryTitle,
  onSave,
  onCancel,
}: {
  readonly topping?: Topping
  /** Segunda pista do ícone automático, quando o nome não diz nada. */
  readonly categoryTitle: string
  readonly onSave: (values: ToppingValues) => void
  readonly onCancel: () => void
}) {
  const [values, setValues] = useState<ToppingValues>(
    topping
      ? {
          name: topping.name,
          price: topping.price,
          emoji: topping.emoji,
          image: topping.image ?? '',
        }
      : emptyTopping,
  )

  const set = <K extends keyof ToppingValues>(key: K, value: ToppingValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }))

  // Ícone que o site usaria agora: o digitado, ou o que o nome sugere.
  const suggestion = suggestEmoji(values.name, categoryTitle)
  const chosen = values.emoji.trim()
  const preview = chosen || suggestion

  return (
    <div className="border-t border-acai-100 bg-acai-50/50 p-3">
      <div className="mb-3 flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-acai-50 text-xl">
          <span aria-hidden="true">{preview}</span>
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-ink">
            {values.name.trim() || 'Novo complemento'}
          </span>
          <span className="block text-xs text-muted">
            {chosen ? 'Ícone escolhido por você' : 'Ícone escolhido pelo nome, sem você fazer nada'}
          </span>
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Nome"
          required
          value={values.name}
          onChange={(value) => set('name', value)}
          placeholder="Morango"
        />
        <Field
          label="Emoji"
          value={values.emoji}
          onChange={(value) => set('emoji', value)}
          placeholder={suggestion}
          hint={chosen ? undefined : `Vazio, o site usa ${suggestion} por causa do nome`}
          maxLength={4}
        />
        <NumberField
          label="Preço do adicional"
          value={values.price}
          onChange={(value) => set('price', value)}
          hint="Cobrado só depois que a cota grátis da categoria acaba"
        />
        <Field
          label="Foto"
          value={values.image}
          onChange={(value) => set('image', value)}
          placeholder="/imagem/morango.webp"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PrimaryButton
          onClick={() => onSave({ ...values, emoji: preview })}
          disabled={values.name.trim() === ''}
        >
          Salvar
        </PrimaryButton>
        <GhostButton onClick={onCancel}>Cancelar</GhostButton>
      </div>
    </div>
  )
}
