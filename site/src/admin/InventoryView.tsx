import { useEffect, useMemo, useState } from 'react'
import { addEntry } from '../finance/store'
import type { InventoryItem, Movement } from '../inventory/store'
import {
  addItem,
  listItems,
  listMovements,
  needsRestock,
  registerMovement,
  removeItem,
  starterItems,
  subscribeToInventory,
  unitLabels,
} from '../inventory/store'
import { formatPrice } from '../lib/order'
import { formatTime, normalize } from './metrics'
import { MovementForm } from './MovementForm'
import { NewSupplyForm } from './NewSupplyForm'

/**
 * Estoque interno: o que a loja tem para produzir. Quantidade, mínimo de
 * segurança e o histórico de tudo que entrou e saiu.
 */

export function InventoryView() {
  const [items, setItems] = useState<readonly InventoryItem[]>([])
  const [moves, setMoves] = useState<readonly Movement[]>([])
  const [creating, setCreating] = useState(false)
  const [moving, setMoving] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const sync = () => {
      setItems(listItems())
      setMoves(listMovements())
    }
    sync()
    return subscribeToInventory(sync)
  }, [])

  const term = search.trim()

  const visible = useMemo(
    () =>
      term === ''
        ? items
        : items.filter((item) =>
            normalize(`${item.name} ${item.category}`).includes(normalize(term)),
          ),
    [items, term],
  )

  const restock = useMemo(() => items.filter(needsRestock), [items])

  const groups = useMemo(() => {
    const map = new Map<string, InventoryItem[]>()
    for (const item of visible) {
      const list = map.get(item.category) ?? []
      list.push(item)
      map.set(item.category, list)
    }
    return [...map.entries()]
  }, [visible])

  const spent = useMemo(
    () => moves.reduce((total, move) => total + (move.cost ?? 0), 0),
    [moves],
  )

  const save = (itemId: string, quantity: number, type: 'entrada' | 'saida', reason: string, cost: number | undefined, alsoInFinance: boolean) => {
    const item = items.find((current) => current.id === itemId)
    registerMovement({ itemId, type, quantity, reason, ...(cost !== undefined && { cost }) })

    if (alsoInFinance && cost !== undefined && item) {
      addEntry({
        date: new Date().toISOString().slice(0, 10),
        type: 'saida',
        description: `${reason} · ${item.name} (${quantity} ${unitLabels[item.unit]})`,
        category: 'Insumos',
        amount: cost,
      })
    }

    setMoving(null)
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Estoque</h1>
          <p className="mt-1 text-sm text-muted">
            O que a loja tem para produzir. Nada aqui aparece no site — isso é a aba Site.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreating((value) => !value)}
          aria-expanded={creating}
          className="rounded-full bg-acai-800 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-acai-900"
        >
          {creating ? 'Fechar cadastro' : '+ Novo insumo'}
        </button>
      </div>

      {creating && (
        <NewSupplyForm
          onCreate={(draft) => {
            addItem(draft)
            setCreating(false)
          }}
          onCancel={() => setCreating(false)}
        />
      )}

      {items.length === 0 ? (
        <div className="mt-5 rounded-card border border-dashed border-acai-200 p-10 text-center">
          <p className="text-sm font-bold text-ink">A despensa ainda está vazia.</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Cadastre o que você compra para produzir: polpa, granola, leite condensado, copo,
            colher. Depois é só dar entrada quando chegar e saída conforme usa.
          </p>
          <button
            type="button"
            onClick={() => starterItems.forEach(addItem)}
            className="mt-4 rounded-full border border-acai-200 px-5 py-2.5 text-xs font-bold text-acai-800 transition-colors hover:bg-acai-50"
          >
            Começar com uma lista pronta de açaiteria
          </button>
        </div>
      ) : (
        <>
          <section aria-label="Resumo" className="mt-5 grid gap-3 sm:grid-cols-3">
            <Stat label="Insumos cadastrados" value={String(items.length)} accent="text-acai-800" />
            <Stat
              label="Precisam de reposição"
              value={String(restock.length)}
              accent={restock.length > 0 ? 'text-red-600' : 'text-emerald-600'}
            />
            <Stat label="Comprado (registrado)" value={formatPrice(spent)} accent="text-ink" />
          </section>

          {restock.length > 0 && (
            <section className="mt-5 rounded-card border border-red-200 bg-red-50 p-5">
              <h2 className="text-sm font-extrabold text-red-800">
                Repor agora
                <span className="ml-2 font-semibold">{restock.length}</span>
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {restock.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-red-800 ring-1 ring-red-200"
                  >
                    {item.name}
                    <span className="ml-1.5 font-semibold text-muted">
                      {item.quantity} de {item.minQuantity} {unitLabels[item.unit]}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="relative mt-5 max-w-xs">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar insumo…"
              aria-label="Buscar insumo"
              className="w-full rounded-full border border-acai-200 bg-white px-4 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-acai-500"
            />
          </div>

          {groups.length === 0 ? (
            <p className="mt-5 rounded-card border border-dashed border-acai-200 p-8 text-center text-sm text-muted">
              Nenhum insumo encontrado para "{term}".
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {groups.map(([category, list]) => (
                <section
                  key={category}
                  className="rounded-card border border-acai-100 bg-white p-5 shadow-sm"
                >
                  <h2 className="text-sm font-extrabold text-ink">{category}</h2>

                  <ul className="mt-3 divide-y divide-acai-100">
                    {list.map((item) => (
                      <li key={item.id} className="py-3">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                          <div className="min-w-0 flex-1">
                            <p className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-ink">{item.name}</span>
                              {needsRestock(item) && (
                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-800">
                                  repor
                                </span>
                              )}
                            </p>
                            <p className="mt-0.5 text-xs text-muted">
                              mínimo {item.minQuantity} {unitLabels[item.unit]}
                            </p>
                          </div>

                          <p className="shrink-0 text-right">
                            <span
                              className={`text-lg font-extrabold ${
                                needsRestock(item) ? 'text-red-600' : 'text-acai-800'
                              }`}
                            >
                              {item.quantity}
                            </span>
                            <span className="ml-1 text-xs font-bold text-muted">
                              {unitLabels[item.unit]}
                            </span>
                          </p>

                          <button
                            type="button"
                            onClick={() => setMoving(moving === item.id ? null : item.id)}
                            aria-expanded={moving === item.id}
                            className="shrink-0 rounded-full border border-acai-200 px-4 py-2 text-xs font-bold text-acai-800 transition-colors hover:bg-acai-50"
                          >
                            Movimentar
                          </button>

                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            aria-label={`Excluir ${item.name}`}
                            className="shrink-0 rounded-full p-1.5 text-muted transition-colors hover:bg-acai-50 hover:text-red-700"
                          >
                            <TrashIcon />
                          </button>
                        </div>

                        <QuantityBar item={item} />

                        {moving === item.id && (
                          <MovementForm
                            item={item}
                            onCancel={() => setMoving(null)}
                            onSave={(movement, alsoInFinance) =>
                              save(
                                movement.itemId,
                                movement.quantity,
                                movement.type,
                                movement.reason,
                                movement.cost,
                                alsoInFinance,
                              )
                            }
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          <section className="mt-6 rounded-card border border-acai-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-extrabold text-ink">
              Movimentações
              <span className="ml-2 text-xs font-semibold text-muted">{moves.length}</span>
            </h2>

            {moves.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                Nenhuma movimentação ainda. Elas aparecem aqui conforme você dá entrada e saída.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-acai-100">
                {moves.slice(0, 30).map((move) => (
                  <li key={move.id} className="flex items-center gap-3 py-2.5">
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-extrabold ${
                        move.type === 'entrada'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                      aria-hidden="true"
                    >
                      {move.type === 'entrada' ? '+' : '−'}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{move.itemName}</p>
                      <p className="truncate text-xs text-muted">
                        {new Date(move.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                        })}{' '}
                        {formatTime(move.createdAt)} · {move.reason}
                      </p>
                    </div>

                    {move.cost !== undefined && (
                      <span className="shrink-0 text-xs font-bold text-muted">
                        {formatPrice(move.cost)}
                      </span>
                    )}

                    <span
                      className={`shrink-0 text-sm font-extrabold ${
                        move.type === 'entrada' ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {move.type === 'entrada' ? '+' : '−'}
                      {move.quantity} {unitLabels[move.unit]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  )
}

/** Barra do saldo contra o mínimo, cheia quando há o dobro do mínimo. */
function QuantityBar({ item }: { readonly item: InventoryItem }) {
  const target = item.minQuantity > 0 ? item.minQuantity * 2 : Math.max(item.quantity, 1)
  const share = Math.min(100, Math.round((item.quantity / target) * 100))

  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-acai-100">
      <div
        className={`h-full rounded-full transition-[width] ${
          needsRestock(item) ? 'bg-red-500' : share < 60 ? 'bg-amber-500' : 'bg-emerald-500'
        }`}
        style={{ width: `${share}%` }}
      />
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  readonly label: string
  readonly value: string
  readonly accent: string
}) {
  return (
    <article className="rounded-card border border-acai-100 bg-white p-5 shadow-sm transition duration-200 hover:border-acai-200 hover:shadow-md motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.02]">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className={`mt-2 text-3xl font-extrabold tracking-tight ${accent}`}>{value}</p>
    </article>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
      <path d="M9 3a1 1 0 0 0-1 1v1H5a1 1 0 0 0 0 2h14a1 1 0 1 0 0-2h-3V4a1 1 0 0 0-1-1H9Zm-2.6 6 .8 10.2A2 2 0 0 0 9.2 21h5.6a2 2 0 0 0 2-1.8L17.6 9H6.4Zm3.6 2a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1Zm4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1Z" />
    </svg>
  )
}
