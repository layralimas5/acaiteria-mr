import { useState } from 'react'
import {
  createBase,
  createSize,
  deleteBase,
  deleteProduct,
  deleteSize,
  swapOrder,
  updateBase,
  updateProduct,
  updateSize,
} from '../../catalog/api'
import { sizeImage } from '../../catalog/productImage'
import type { AcaiBase, CupSize, ProductKind } from '../../catalog/types'
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
 * Um produto do cardápio, com os tamanhos e as bases dele.
 *
 * Tudo é edição no lugar: a loja clica no lápis, muda o que precisa e salva.
 * Desligar o item some do site na hora; apagar tira do cadastro para sempre.
 */

interface ProductEditorProps {
  readonly product: ProductKind
  readonly siblings: readonly ProductKind[]
  /** Executa a ação no banco, cuidando de erro e recarga do cardápio. */
  readonly run: (action: () => Promise<void>) => void
  readonly busy: boolean
}

export function ProductEditor({ product, siblings, run, busy }: ProductEditorProps) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)

  const index = siblings.findIndex((item) => item.id === product.id)
  const previous = siblings[index - 1]
  const next = siblings[index + 1]

  const confirmDelete = () => {
    const message = `Apagar "${product.name}" do cardápio? Os tamanhos e as bases dele também somem. Pedidos antigos não mudam.`
    if (window.confirm(message)) run(() => deleteProduct(product.id))
  }

  return (
    <article className="rounded-card border border-acai-100 bg-white shadow-sm">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 p-4">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span aria-hidden="true" className="text-2xl">
            {product.emoji || '🍨'}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-extrabold text-ink">{product.name}</span>
            <span className="block truncate text-xs text-muted">
              {product.sizes.length} {product.sizes.length === 1 ? 'tamanho' : 'tamanhos'} ·{' '}
              {product.bases.length} {product.baseLabel.toLowerCase()}
              {product.bases.length === 1 ? '' : 's'}
            </span>
          </span>
        </button>

        <AvailableSwitch
          checked={product.available}
          onChange={(available) => run(() => updateProduct(product.id, { available }))}
          label={product.available ? 'No site' : 'Fora do site'}
        />

        <div className="flex items-center gap-1">
          <IconButton
            label="Subir"
            disabled={busy || !previous}
            onClick={() => previous && run(() => swapOrder('products', product, previous))}
          >
            <UpIcon />
          </IconButton>
          <IconButton
            label="Descer"
            disabled={busy || !next}
            onClick={() => next && run(() => swapOrder('products', product, next))}
          >
            <DownIcon />
          </IconButton>
          <IconButton label="Editar produto" disabled={busy} onClick={() => setEditing((v) => !v)}>
            <PencilIcon />
          </IconButton>
          <IconButton label="Apagar produto" disabled={busy} onClick={confirmDelete}>
            <TrashIcon />
          </IconButton>
        </div>
      </header>

      {editing && (
        <ProductForm
          product={product}
          onCancel={() => setEditing(false)}
          onSave={(draft) => {
            run(() => updateProduct(product.id, draft))
            setEditing(false)
          }}
        />
      )}

      {open && (
        <div className="border-t border-acai-100 p-4">
          <SizeList product={product} run={run} busy={busy} />
          <BaseList product={product} run={run} busy={busy} />
        </div>
      )}
    </article>
  )
}

// ---------------------------------------------------------------------------
// Produto
// ---------------------------------------------------------------------------

interface ProductFormValues {
  readonly name: string
  readonly description: string
  readonly emoji: string
  readonly baseStepTitle: string
  readonly baseStepSubtitle: string
  readonly baseLabel: string
}

export const emptyProductForm: ProductFormValues = {
  name: '',
  description: '',
  emoji: '',
  baseStepTitle: 'Escolha sua base',
  baseStepSubtitle: 'Uma por copo.',
  baseLabel: 'Base',
}

export function ProductForm({
  product,
  onSave,
  onCancel,
}: {
  readonly product?: ProductKind
  readonly onSave: (draft: ProductFormValues) => void
  readonly onCancel: () => void
}) {
  const [values, setValues] = useState<ProductFormValues>(
    product
      ? {
          name: product.name,
          description: product.description,
          emoji: product.emoji,
          baseStepTitle: product.baseStepTitle,
          baseStepSubtitle: product.baseStepSubtitle,
          baseLabel: product.baseLabel,
        }
      : emptyProductForm,
  )

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }))

  return (
    <div className="border-t border-acai-100 bg-acai-50/50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Nome do produto"
          required
          value={values.name}
          onChange={(value) => set('name', value)}
          placeholder="Açaí"
        />
        <Field
          label="Emoji"
          value={values.emoji}
          onChange={(value) => set('emoji', value)}
          placeholder="🍇"
          maxLength={4}
          hint="Aparece no card de escolha do produto"
        />
        <Field
          label="Descrição"
          value={values.description}
          onChange={(value) => set('description', value)}
          placeholder="Cremoso, batido na hora, montado do seu jeito."
          className="sm:col-span-2"
        />
        <Field
          label="Como chamar a escolha"
          required
          value={values.baseLabel}
          onChange={(value) => set('baseLabel', value)}
          placeholder="Base"
          hint='No açaí é "Base"; no sorvete costuma ser "Sabor"'
        />
        <Field
          label="Título da etapa"
          required
          value={values.baseStepTitle}
          onChange={(value) => set('baseStepTitle', value)}
          placeholder="Escolha sua base"
        />
        <Field
          label="Linha de apoio da etapa"
          value={values.baseStepSubtitle}
          onChange={(value) => set('baseStepSubtitle', value)}
          placeholder="Uma base por copo."
          className="sm:col-span-2"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <PrimaryButton
          onClick={() => onSave(values)}
          disabled={values.name.trim() === '' || values.baseLabel.trim() === ''}
        >
          Salvar
        </PrimaryButton>
        <GhostButton onClick={onCancel}>Cancelar</GhostButton>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tamanhos
// ---------------------------------------------------------------------------

interface SizeValues {
  readonly name: string
  readonly volume: string
  readonly basePrice: number
  readonly image: string
  readonly highlight: string
}

const emptySize: SizeValues = { name: '', volume: '', basePrice: 0, image: '', highlight: '' }

function SizeList({
  product,
  run,
  busy,
}: {
  readonly product: ProductKind
  readonly run: (action: () => Promise<void>) => void
  readonly busy: boolean
}) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Tamanhos</h3>
        <GhostButton onClick={() => setAdding((value) => !value)}>
          {adding ? 'Fechar' : '+ Novo tamanho'}
        </GhostButton>
      </div>

      {product.sizes.length === 0 && !adding && (
        <p className="mt-2 rounded-2xl bg-acai-50 px-4 py-3 text-xs font-semibold text-muted">
          Sem tamanho cadastrado, esse produto não aparece no site. Sem tamanho não há preço.
        </p>
      )}

      <ul className="mt-2 space-y-2">
        {product.sizes.map((size, index) => {
          const previous = product.sizes[index - 1]
          const next = product.sizes[index + 1]

          return (
            <li key={size.id} className="rounded-2xl border border-acai-100">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-ink">{size.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {size.volume && `${size.volume} · `}
                    {formatPrice(size.basePrice)}
                    {size.highlight && ` · ${size.highlight}`}
                  </span>
                </span>

                <AvailableSwitch
                  checked={size.available}
                  onChange={(available) => run(() => updateSize(size.id, { available }))}
                  label={size.available ? 'No site' : 'Esgotado'}
                />

                <div className="flex items-center gap-1">
                  <IconButton
                    label="Subir"
                    disabled={busy || !previous}
                    onClick={() => previous && run(() => swapOrder('product_sizes', size, previous))}
                  >
                    <UpIcon />
                  </IconButton>
                  <IconButton
                    label="Descer"
                    disabled={busy || !next}
                    onClick={() => next && run(() => swapOrder('product_sizes', size, next))}
                  >
                    <DownIcon />
                  </IconButton>
                  <IconButton
                    label="Editar tamanho"
                    disabled={busy}
                    onClick={() => setEditingId(editingId === size.id ? null : size.id)}
                  >
                    <PencilIcon />
                  </IconButton>
                  <IconButton
                    label="Apagar tamanho"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm(`Apagar o tamanho "${size.name}"?`)) {
                        run(() => deleteSize(size.id))
                      }
                    }}
                  >
                    <TrashIcon />
                  </IconButton>
                </div>
              </div>

              {editingId === size.id && (
                <SizeForm
                  size={size}
                  onCancel={() => setEditingId(null)}
                  onSave={(values) => {
                    run(() => updateSize(size.id, values))
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
          <SizeForm
            onCancel={() => setAdding(false)}
            onSave={(values) => {
              run(() => createSize(product.id, values, product.sizes))
              setAdding(false)
            }}
          />
        </div>
      )}
    </section>
  )
}

function SizeForm({
  size,
  onSave,
  onCancel,
}: {
  readonly size?: CupSize
  readonly onSave: (values: SizeValues) => void
  readonly onCancel: () => void
}) {
  const [values, setValues] = useState<SizeValues>(
    size
      ? {
          name: size.name,
          volume: size.volume,
          basePrice: size.basePrice,
          image: size.image ?? '',
          highlight: size.highlight ?? '',
        }
      : emptySize,
  )

  const set = <K extends keyof SizeValues>(key: K, value: SizeValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }))

  // Foto que o site usaria agora: a digitada, ou a que a medida sugere.
  const suggestedImage = sizeImage(values.volume, values.name)
  const chosenImage = values.image.trim()
  const previewImage = chosenImage || suggestedImage

  return (
    <div className="border-t border-acai-100 bg-acai-50/50 p-3">
      <div className="mb-3 flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5">
        <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-acai-900">
          {previewImage ? (
            <img src={previewImage} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-[10px] font-extrabold text-white/90">
              {values.volume.trim() || '?'}
            </span>
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-ink">
            {values.name.trim() || 'Novo tamanho'}
          </span>
          <span className="block text-xs text-muted">
            {chosenImage
              ? 'Foto escolhida por você'
              : suggestedImage
                ? 'Foto escolhida pela medida, sem você fazer nada'
                : 'Sem foto para essa medida: o card mostra a medida escrita'}
          </span>
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Nome"
          required
          value={values.name}
          onChange={(value) => set('name', value)}
          placeholder="Açaí 500ml"
        />
        <Field
          label="Medida"
          value={values.volume}
          onChange={(value) => set('volume', value)}
          placeholder="500ml"
        />
        <NumberField
          label="Preço"
          value={values.basePrice}
          onChange={(value) => set('basePrice', value)}
          hint="Preço cheio do copo, sem complementos pagos"
        />
        <Field
          label="Etiqueta"
          value={values.highlight}
          onChange={(value) => set('highlight', value)}
          placeholder="Mais pedido"
        />
        <Field
          label="Foto"
          value={values.image}
          onChange={(value) => set('image', value)}
          placeholder={suggestedImage ?? '/imagem/pote-500ml.webp'}
          hint={
            chosenImage || !suggestedImage
              ? 'Caminho de um arquivo já publicado na pasta public'
              : `Vazio, o site usa ${suggestedImage} por causa da medida`
          }
          className="sm:col-span-2"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PrimaryButton
          onClick={() => onSave(values)}
          disabled={values.name.trim() === '' || values.basePrice <= 0}
        >
          Salvar
        </PrimaryButton>
        <GhostButton onClick={onCancel}>Cancelar</GhostButton>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bases e sabores
// ---------------------------------------------------------------------------

interface BaseValues {
  readonly name: string
  readonly description: string
  readonly extraPrice: number
}

const emptyBase: BaseValues = { name: '', description: '', extraPrice: 0 }

function BaseList({
  product,
  run,
  busy,
}: {
  readonly product: ProductKind
  readonly run: (action: () => Promise<void>) => void
  readonly busy: boolean
}) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const label = product.baseLabel.toLowerCase()

  return (
    <section className="mt-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
          {product.baseLabel}
        </h3>
        <GhostButton onClick={() => setAdding((value) => !value)}>
          {adding ? 'Fechar' : `+ Nova ${label}`}
        </GhostButton>
      </div>

      {product.bases.length === 0 && !adding && (
        <p className="mt-2 rounded-2xl bg-acai-50 px-4 py-3 text-xs font-semibold text-muted">
          Sem {label} cadastrada, esse produto não aparece no site.
        </p>
      )}

      <ul className="mt-2 space-y-2">
        {product.bases.map((base, index) => {
          const previous = product.bases[index - 1]
          const next = product.bases[index + 1]

          return (
            <li key={base.id} className="rounded-2xl border border-acai-100">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-ink">{base.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {base.extraPrice > 0 ? `+ ${formatPrice(base.extraPrice)}` : 'Sem custo extra'}
                    {base.description && ` · ${base.description}`}
                  </span>
                </span>

                <AvailableSwitch
                  checked={base.available}
                  onChange={(available) => run(() => updateBase(base.id, { available }))}
                  label={base.available ? 'No site' : 'Esgotada'}
                />

                <div className="flex items-center gap-1">
                  <IconButton
                    label="Subir"
                    disabled={busy || !previous}
                    onClick={() => previous && run(() => swapOrder('product_bases', base, previous))}
                  >
                    <UpIcon />
                  </IconButton>
                  <IconButton
                    label="Descer"
                    disabled={busy || !next}
                    onClick={() => next && run(() => swapOrder('product_bases', base, next))}
                  >
                    <DownIcon />
                  </IconButton>
                  <IconButton
                    label="Editar"
                    disabled={busy}
                    onClick={() => setEditingId(editingId === base.id ? null : base.id)}
                  >
                    <PencilIcon />
                  </IconButton>
                  <IconButton
                    label="Apagar"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm(`Apagar "${base.name}"?`)) run(() => deleteBase(base.id))
                    }}
                  >
                    <TrashIcon />
                  </IconButton>
                </div>
              </div>

              {editingId === base.id && (
                <BaseForm
                  base={base}
                  onCancel={() => setEditingId(null)}
                  onSave={(values) => {
                    run(() => updateBase(base.id, values))
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
          <BaseForm
            onCancel={() => setAdding(false)}
            onSave={(values) => {
              run(() => createBase(product.id, values, product.bases))
              setAdding(false)
            }}
          />
        </div>
      )}
    </section>
  )
}

function BaseForm({
  base,
  onSave,
  onCancel,
}: {
  readonly base?: AcaiBase
  readonly onSave: (values: BaseValues) => void
  readonly onCancel: () => void
}) {
  const [values, setValues] = useState<BaseValues>(
    base
      ? { name: base.name, description: base.description, extraPrice: base.extraPrice }
      : emptyBase,
  )

  const set = <K extends keyof BaseValues>(key: K, value: BaseValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }))

  return (
    <div className="border-t border-acai-100 bg-acai-50/50 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Nome"
          required
          value={values.name}
          onChange={(value) => set('name', value)}
          placeholder="Açaí tradicional"
        />
        <NumberField
          label="Acréscimo"
          value={values.extraPrice}
          onChange={(value) => set('extraPrice', value)}
          hint="Some ao preço do tamanho. Zero na maioria dos casos"
        />
        <Field
          label="Descrição"
          value={values.description}
          onChange={(value) => set('description', value)}
          placeholder="O clássico, cremoso e adoçado na medida."
          className="sm:col-span-2"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PrimaryButton onClick={() => onSave(values)} disabled={values.name.trim() === ''}>
          Salvar
        </PrimaryButton>
        <GhostButton onClick={onCancel}>Cancelar</GhostButton>
      </div>
    </div>
  )
}
