import { useState } from 'react'
import { formatPrice } from '../lib/order'
import { productKinds, toppingCategories, toppings } from '../data/builder'
import type { CustomItem } from '../stock/custom'
import {
  addCustomItem,
  kindLabels,
  removeCustomItem,
  setCustomItemVisible,
} from '../stock/custom'
import { clearSoldOut, setSoldOut } from '../stock/store'
import { useCustomItems, useSoldOut } from '../stock/useCatalog'
import { NewItemForm } from './NewItemForm'

/**
 * O que está no ar. Junta o cardápio publicado com o que a loja criou aqui, e
 * controla o que o cliente vê agora no montador.
 *
 * Não confundir com Estoque: aqui é vitrine, lá é insumo de produção.
 */

interface SiteItem {
  readonly id: string
  readonly name: string
  readonly detail: string
  /** false quando o próprio cardápio publicado já não oferece o item. */
  readonly inCatalog: boolean
  /** Preenchido só nos itens criados no painel. */
  readonly custom?: CustomItem
}

interface SiteGroup {
  readonly title: string
  readonly items: readonly SiteItem[]
}

const customDetail = (item: CustomItem): string => {
  if (item.kind === 'size') return `${item.volume} · ${formatPrice(item.price)}`
  return item.price > 0 ? `+ ${formatPrice(item.price)}` : 'Sem custo extra'
}

const buildGroups = (custom: readonly CustomItem[]): readonly SiteGroup[] => {
  const customOf = (kind: CustomItem['kind'], productId?: string) =>
    custom
      .filter((item) => item.kind === kind && (!productId || item.productId === productId))
      .map((item) => ({
        id: item.id,
        name: item.emoji ? `${item.emoji} ${item.name}` : item.name,
        detail: customDetail(item),
        inCatalog: true,
        custom: item,
      }))

  const groups: SiteGroup[] = [
    {
      title: 'Produtos',
      items: productKinds.map((product) => ({
        id: product.id,
        name: product.name,
        detail: 'Some o produto inteiro do site',
        inCatalog: product.available,
      })),
    },
  ]

  for (const product of productKinds) {
    groups.push({
      title: `${product.name} · tamanhos`,
      items: [
        ...product.sizes.map((size) => ({
          id: size.id,
          name: size.name,
          detail: `${size.volume} · ${formatPrice(size.basePrice)}`,
          inCatalog: size.available,
        })),
        ...customOf('size', product.id),
      ],
    })
    groups.push({
      title: `${product.name} · ${product.baseLabel.toLowerCase()}`,
      items: [
        ...product.bases.map((base) => ({
          id: base.id,
          name: base.name,
          detail: base.extraPrice > 0 ? `+ ${formatPrice(base.extraPrice)}` : 'Sem custo extra',
          inCatalog: base.available,
        })),
        ...customOf('base', product.id),
      ],
    })
  }

  for (const category of toppingCategories) {
    groups.push({
      title: `Complementos · ${category.title}`,
      items: [
        ...toppings
          .filter((topping) => topping.categoryId === category.id)
          .map((topping) => ({
            id: topping.id,
            name: `${topping.emoji} ${topping.name}`,
            detail: topping.price > 0 ? `+ ${formatPrice(topping.price)}` : 'Sem custo extra',
            inCatalog: topping.available,
          })),
        ...custom
          .filter((item) => item.kind === 'topping' && item.categoryId === category.id)
          .map((item) => ({
            id: item.id,
            name: `${item.emoji ?? '✨'} ${item.name}`,
            detail: customDetail(item),
            inCatalog: true,
            custom: item,
          })),
      ],
    })
  }

  return groups.filter((group) => group.items.length > 0)
}

export function SiteView() {
  const soldOut = useSoldOut()
  const custom = useCustomItems()
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState('')

  const groups = buildGroups(custom)
  const all = groups.flatMap((group) => group.items)

  /** Um item está no ar quando não foi escondido nem marcado como esgotado. */
  const isLive = (item: SiteItem): boolean =>
    (item.custom ? item.custom.visible : item.inCatalog) && !soldOut[item.id]

  const missing = all.filter((item) => !isLive(item)).length

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Site</h1>
          <p className="mt-1 text-sm text-muted">
            O que o cliente vê no montador. Tire do ar o que acabou, cadastre o que é novo — muda
            na hora, sem republicar nada.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {missing > 0 && (
            <button
              type="button"
              onClick={clearSoldOut}
              className="rounded-full border border-acai-200 px-4 py-2 text-xs font-bold text-acai-800 transition-colors hover:bg-acai-50"
            >
              Repor esgotados
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setCreating((value) => !value)
              setCreated('')
            }}
            aria-expanded={creating}
            className="rounded-full bg-acai-800 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-acai-900"
          >
            {creating ? 'Fechar cadastro' : '+ Adicionar item'}
          </button>
        </div>
      </div>

      {creating && (
        <NewItemForm
          onCreate={(draft) => {
            const item = addCustomItem(draft)
            setCreating(false)
            setCreated(`${kindLabels[item.kind]} "${item.name}" já está no site.`)
          }}
          onCancel={() => setCreating(false)}
        />
      )}

      {created && (
        <p
          role="status"
          className="mt-4 rounded-card border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"
        >
          {created}
        </p>
      )}

      <p
        className={`mt-5 rounded-card border p-4 text-sm font-semibold ${
          missing > 0
            ? 'border-amber-200 bg-amber-50 text-amber-800'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800'
        }`}
      >
        {missing > 0
          ? `${all.length - missing} de ${all.length} itens no ar. ${missing} fora do site agora.`
          : `Cardápio completo: os ${all.length} itens estão no ar.`}
      </p>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {groups.map((group) => (
          <section
            key={group.title}
            className="rounded-card border border-acai-100 bg-white p-5 shadow-sm"
          >
            <h2 className="text-sm font-extrabold text-ink">{group.title}</h2>

            <ul className="mt-3 divide-y divide-acai-100">
              {group.items.map((item) => (
                <SiteRow
                  key={item.id}
                  item={item}
                  live={isLive(item)}
                  onToggle={(live) => {
                    if (item.custom) {
                      setCustomItemVisible(item.id, live)
                      return
                    }
                    setSoldOut(item.id, !live)
                  }}
                  onRemove={item.custom ? () => removeCustomItem(item.id) : undefined}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}

function SiteRow({
  item,
  live,
  onToggle,
  onRemove,
}: {
  readonly item: SiteItem
  readonly live: boolean
  readonly onToggle: (live: boolean) => void
  readonly onRemove?: () => void
}) {
  const offLabel = item.custom ? 'Oculto' : 'Esgotado'

  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className={`flex items-center gap-2 truncate text-sm font-bold ${live ? 'text-ink' : 'text-muted'}`}>
          {item.name}
          {item.custom && (
            <span className="shrink-0 rounded-full bg-acai-100 px-2 py-0.5 text-[10px] font-bold text-acai-800">
              criado aqui
            </span>
          )}
        </p>
        <p className="truncate text-xs text-muted">
          {item.inCatalog ? item.detail : 'Fora do cardápio publicado'}
        </p>
      </div>

      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
          live ? 'bg-emerald-100 text-emerald-800' : 'bg-acai-50 text-muted'
        }`}
      >
        {live ? 'No site' : offLabel}
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={live}
        aria-label={`${item.name}: ${live ? `marcar como ${offLabel.toLowerCase()}` : 'colocar no site'}`}
        disabled={!item.inCatalog}
        onClick={() => onToggle(!live)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          live ? 'bg-emerald-500' : 'bg-acai-200'
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-[left] ${
            live ? 'left-[1.375rem]' : 'left-0.5'
          }`}
        />
      </button>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Excluir ${item.name}`}
          className="shrink-0 rounded-full p-1.5 text-muted transition-colors hover:bg-acai-50 hover:text-red-700"
        >
          <TrashIcon />
        </button>
      )}
    </li>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
      <path d="M9 3a1 1 0 0 0-1 1v1H5a1 1 0 0 0 0 2h14a1 1 0 1 0 0-2h-3V4a1 1 0 0 0-1-1H9Zm-2.6 6 .8 10.2A2 2 0 0 0 9.2 21h5.6a2 2 0 0 0 2-1.8L17.6 9H6.4Zm3.6 2a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1Zm4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1Z" />
    </svg>
  )
}
