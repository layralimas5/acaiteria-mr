import { useEffect, useMemo, useState } from 'react'
import type { AcaiBase, CupSize, ProductKind, Topping, ToppingCategoryId } from '../data/builder'
import { FREE_TOPPINGS, productKinds, toppings as catalogToppings } from '../data/builder'
import type { CustomItem } from './custom'
import { readCustomItems, subscribeToCustomItems } from './custom'
import type { SoldOutMap } from './store'
import { readStock, subscribeToStock } from './store'

/**
 * Catálogo que o site enxerga: o cardápio publicado, mais o que a loja criou
 * no painel, menos o que ela marcou como esgotado.
 */

export const useSoldOut = (): SoldOutMap => {
  const [map, setMap] = useState<SoldOutMap>(() => readStock())

  useEffect(() => {
    const sync = () => setMap(readStock())
    sync()
    return subscribeToStock(sync)
  }, [])

  return map
}

export const useCustomItems = (): readonly CustomItem[] => {
  const [items, setItems] = useState<readonly CustomItem[]>(() => readCustomItems())

  useEffect(() => {
    const sync = () => setItems(readCustomItems())
    sync()
    return subscribeToCustomItems(sync)
  }, [])

  return items
}

export interface Catalog {
  readonly products: readonly ProductKind[]
  readonly toppingsByCategory: (categoryId: ToppingCategoryId) => readonly Topping[]
}

const asSize = (item: CustomItem): CupSize => ({
  id: item.id,
  name: item.name,
  volume: item.volume ?? '',
  basePrice: item.price,
  freeToppings: item.freeToppings ?? FREE_TOPPINGS,
  available: true,
})

const asBase = (item: CustomItem): AcaiBase => ({
  id: item.id,
  name: item.name,
  description: item.description ?? '',
  extraPrice: item.price,
  available: true,
})

const asTopping = (item: CustomItem): Topping => ({
  id: item.id,
  name: item.name,
  categoryId: item.categoryId ?? 'frutas',
  price: item.price,
  emoji: item.emoji ?? '✨',
  available: true,
})

export const useCatalog = (): Catalog => {
  const soldOut = useSoldOut()
  const custom = useCustomItems()

  return useMemo(() => {
    const visible = custom.filter((item) => item.visible)
    const ofKind = (kind: CustomItem['kind'], productId?: string) =>
      visible.filter((item) => item.kind === kind && (!productId || item.productId === productId))

    const products = productKinds.map((product) => ({
      ...product,
      available: product.available && !soldOut[product.id],
      sizes: [...product.sizes, ...ofKind('size', product.id).map(asSize)].map((size) => ({
        ...size,
        available: size.available && !soldOut[size.id],
      })),
      bases: [...product.bases, ...ofKind('base', product.id).map(asBase)].map((base) => ({
        ...base,
        available: base.available && !soldOut[base.id],
      })),
    }))

    const toppings = [...catalogToppings, ...ofKind('topping').map(asTopping)].map((topping) => ({
      ...topping,
      available: topping.available && !soldOut[topping.id],
    }))

    return {
      products,
      toppingsByCategory: (categoryId) =>
        toppings.filter((topping) => topping.categoryId === categoryId),
    }
  }, [soldOut, custom])
}
