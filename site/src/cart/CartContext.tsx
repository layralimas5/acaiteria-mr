import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { AcaiBase, CupSize, Topping } from '../data/builder'
import type { BuildSelection } from '../lib/builder'
import { priceBuild } from '../lib/builder'

/**
 * Carrinho da loja. O projeto não usa biblioteca de estado global, então aqui
 * vai o mínimo necessário: useReducer + contexto, com persistência em
 * localStorage para o pedido sobreviver a um refresh.
 */

export interface CartItem {
  /** Identidade da montagem: mesma combinação agrupa, combinação diferente não. */
  readonly id: string
  readonly productType: 'custom-acai'
  readonly size: CupSize
  readonly base: AcaiBase
  readonly toppings: readonly Topping[]
  readonly quantity: number
  readonly unitPrice: number
}

type CartAction =
  | { type: 'add'; item: CartItem }
  | { type: 'increment'; id: string }
  | { type: 'decrement'; id: string }
  | { type: 'remove'; id: string }
  | { type: 'clear' }
  | { type: 'restore'; items: readonly CartItem[] }

const STORAGE_KEY = 'acaiteria-mr:cart'

const buildId = (selection: BuildSelection): string => {
  const toppingIds = selection.toppings.map((topping) => topping.id).sort()
  return [selection.size?.id, selection.base?.id, ...toppingIds].join('|')
}

const reducer = (state: readonly CartItem[], action: CartAction): readonly CartItem[] => {
  switch (action.type) {
    case 'restore':
      return action.items

    case 'add': {
      const existing = state.find((item) => item.id === action.item.id)
      if (!existing) return [...state, action.item]
      return state.map((item) =>
        item.id === action.item.id ? { ...item, quantity: item.quantity + action.item.quantity } : item,
      )
    }

    case 'increment':
      return state.map((item) => (item.id === action.id ? { ...item, quantity: item.quantity + 1 } : item))

    case 'decrement':
      return state
        .map((item) => (item.id === action.id ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)

    case 'remove':
      return state.filter((item) => item.id !== action.id)

    case 'clear':
      return []
  }
}

interface CartValue {
  readonly items: readonly CartItem[]
  readonly count: number
  readonly total: number
  readonly addBuild: (selection: BuildSelection) => CartItem | null
  readonly increment: (id: string) => void
  readonly decrement: (id: string) => void
  readonly remove: (id: string) => void
  readonly clear: () => void
}

const CartContext = createContext<CartValue | null>(null)

const readStored = (): readonly CartItem[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as CartItem[]) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { readonly children: ReactNode }) {
  const [items, dispatch] = useReducer(reducer, [])

  useEffect(() => {
    const stored = readStored()
    if (stored.length > 0) dispatch({ type: 'restore', items: stored })
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Navegador sem storage disponível: o carrinho segue só em memória.
    }
  }, [items])

  const addBuild = useCallback((selection: BuildSelection): CartItem | null => {
    if (!selection.size || !selection.base) return null

    const item: CartItem = {
      id: buildId(selection),
      productType: 'custom-acai',
      size: selection.size,
      base: selection.base,
      toppings: selection.toppings,
      quantity: 1,
      unitPrice: priceBuild(selection).totalPrice,
    }

    dispatch({ type: 'add', item })
    return item
  }, [])

  const value = useMemo<CartValue>(
    () => ({
      items,
      count: items.reduce((total, item) => total + item.quantity, 0),
      total: items.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
      addBuild,
      increment: (id: string) => dispatch({ type: 'increment', id }),
      decrement: (id: string) => dispatch({ type: 'decrement', id }),
      remove: (id: string) => dispatch({ type: 'remove', id }),
      clear: () => dispatch({ type: 'clear' }),
    }),
    [items, addBuild],
  )

  return <CartContext value={value}>{children}</CartContext>
}

export const useCart = (): CartValue => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart precisa estar dentro de <CartProvider>')
  return context
}
