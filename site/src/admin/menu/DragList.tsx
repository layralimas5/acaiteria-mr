import { useEffect, useState } from 'react'
import type { DragEvent, KeyboardEvent, ReactNode } from 'react'

/**
 * Lista reordenável do cardápio.
 *
 * A loja pega o item pela alça e arrasta para o lugar que quiser, em vez de
 * empurrar linha por linha com seta de subir e descer. A lista se reorganiza
 * enquanto o dedo (ou o mouse) ainda está em cima e só grava quando solta.
 *
 * Quem não usa mouse não fica de fora: a alça é um botão de verdade, e com ela
 * em foco as setas do teclado movem o item uma posição, Home leva para o
 * começo e End para o fim.
 */

interface Sortable {
  readonly id: string
}

interface DragListProps<T extends Sortable> {
  readonly items: readonly T[]
  /** Nova ordem completa, do primeiro ao último. */
  readonly onReorder: (ids: readonly string[]) => void
  /** Como chamar o item no aviso do leitor de tela ("tamanho", "complemento"). */
  readonly itemLabel: string
  /** Texto do item, para a alça dizer o que está movendo. */
  readonly nameOf: (item: T) => string
  readonly disabled?: boolean
  readonly className?: string
  /** A alça vem pronta: o editor decide onde encaixar na linha. */
  readonly children: (item: T, handle: ReactNode) => ReactNode
}

const sameOrder = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((id, index) => id === b[index])

const move = (ids: readonly string[], from: number, to: number): readonly string[] => {
  const next = [...ids]
  const [moved] = next.splice(from, 1)
  if (moved === undefined) return ids
  next.splice(Math.max(0, Math.min(to, next.length)), 0, moved)
  return next
}

export function DragList<T extends Sortable>({
  items,
  onReorder,
  itemLabel,
  nameOf,
  disabled = false,
  className = 'mt-2 space-y-2',
  children,
}: DragListProps<T>) {
  /** Ordem que a tela mostra enquanto o banco ainda não confirmou. */
  const [order, setOrder] = useState<readonly string[] | null>(null)
  /** Item preso ao ponteiro. */
  const [draggingId, setDraggingId] = useState<string | null>(null)
  /** Linha liberada para arrastar porque o dedo desceu sobre a alça dela. */
  const [armedId, setArmedId] = useState<string | null>(null)

  const ids = items.map((item) => item.id)
  const known = (list: readonly string[]): boolean =>
    list.length === ids.length && list.every((id) => ids.includes(id))

  // O banco confirmou (ou alguém mexeu no cadastro): a ordem local sai de cena.
  useEffect(() => {
    if (order && (!known(order) || sameOrder(order, ids))) setOrder(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join('|')])

  const visibleIds = order && known(order) ? order : ids
  const visible = visibleIds.flatMap((id) => items.filter((item) => item.id === id))

  const commit = (next: readonly string[]) => {
    if (sameOrder(next, ids)) return
    setOrder(next)
    onReorder(next)
  }

  const dropOn = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return
    const from = visibleIds.indexOf(draggingId)
    const to = visibleIds.indexOf(targetId)
    if (from < 0 || to < 0) return
    setOrder(move(visibleIds, from, to))
  }

  const finish = () => {
    setDraggingId(null)
    setArmedId(null)
    if (order && !sameOrder(order, ids)) onReorder(order)
  }

  const nudge = (id: string, to: number) => {
    const from = visibleIds.indexOf(id)
    if (from < 0 || to < 0 || to > visibleIds.length - 1 || to === from) return
    commit(move(visibleIds, from, to))
  }

  const onHandleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const at = visibleIds.indexOf(id)
    const keys: Readonly<Record<string, number>> = {
      ArrowUp: at - 1,
      ArrowLeft: at - 1,
      ArrowDown: at + 1,
      ArrowRight: at + 1,
      Home: 0,
      End: visibleIds.length - 1,
    }
    const to = keys[event.key]
    if (to === undefined) return
    event.preventDefault()
    nudge(id, to)
  }

  const allowDrop = (event: DragEvent<HTMLLIElement>) => {
    if (!draggingId) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  return (
    <ul className={className}>
      {visible.map((item, index) => {
        const dragging = draggingId === item.id

        const handle = (
          <button
            type="button"
            disabled={disabled}
            onPointerDown={() => setArmedId(item.id)}
            onPointerUp={() => setArmedId(null)}
            onKeyDown={(event) => onHandleKeyDown(event, item.id)}
            aria-label={`Mover ${itemLabel} ${nameOf(item)}. Posição ${index + 1} de ${visible.length}. Arraste, ou use as setas do teclado.`}
            title="Arraste para reordenar"
            className="grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-full text-muted transition-colors hover:bg-acai-50 hover:text-acai-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acai-800 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-30"
          >
            <GripIcon />
          </button>
        )

        return (
          <li
            key={item.id}
            draggable={armedId === item.id}
            onDragStart={(event) => {
              setDraggingId(item.id)
              event.dataTransfer.effectAllowed = 'move'
              // Firefox só inicia o arraste com algum dado no evento.
              event.dataTransfer.setData('text/plain', item.id)
            }}
            onDragEnd={finish}
            onDragOver={allowDrop}
            onDragEnter={() => dropOn(item.id)}
            onDrop={(event) => {
              event.preventDefault()
              dropOn(item.id)
              finish()
            }}
            className={`transition-opacity ${dragging ? 'opacity-50' : ''}`}
          >
            {children(item, handle)}
          </li>
        )
      })}
    </ul>
  )
}

function GripIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
      <circle cx="9" cy="6" r="1.6" />
      <circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" />
      <circle cx="15" cy="18" r="1.6" />
    </svg>
  )
}
