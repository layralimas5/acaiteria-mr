import { cartItemId } from '../cart/CartContext'
import type { CartItem } from '../cart/CartContext'
import type { Catalog } from '../catalog/types'
import { priceBuild } from './builder'

/**
 * Reconstrói um pedido antigo contra o catálogo de hoje.
 *
 * Nunca reaproveitamos o preço salvo: tabela muda, item sai de linha, a loja
 * marca algo como esgotado. Cada item é remontado a partir do catálogo atual e
 * reprecificado; o que não existe mais fica de fora e é devolvido em
 * `dropped` para a tela avisar em vez de entregar um pedido errado em silêncio.
 */

export interface RepeatResult {
  readonly items: readonly CartItem[]
  /** Nomes do que não pôde voltar (produto, tamanho ou base indisponível). */
  readonly dropped: readonly string[]
  /** Nomes de complementos que saíram, mas cujo item continuou. */
  readonly droppedToppings: readonly string[]
}

export const rebuildOrder = (previous: readonly CartItem[], catalog: Catalog): RepeatResult => {
  const items: CartItem[] = []
  const dropped: string[] = []
  const droppedToppings: string[] = []

  for (const old of previous) {
    const product = catalog.products.find((item) => item.id === old.product.id)
    const size = product?.sizes.find((item) => item.id === old.size.id)
    const base = product?.bases.find((item) => item.id === old.base.id)

    if (!product?.available || !size?.available || !base?.available) {
      dropped.push(`${old.size.name} (${old.base.name})`)
      continue
    }

    const toppings = old.toppings.flatMap((topping) => {
      const current = catalog.toppings.find((item) => item.id === topping.id)
      if (current?.available) return [current]
      droppedToppings.push(topping.name)
      return []
    })

    const selection = { product, size, base, toppings }
    const notes = old.notes?.trim() ?? ''

    items.push({
      id: cartItemId(selection, notes),
      productName: product.name,
      product,
      size,
      base,
      toppings,
      quantity: old.quantity,
      unitPrice: priceBuild(selection, catalog.categories).totalPrice,
      ...(notes ? { notes } : {}),
    })
  }

  return { items, dropped, droppedToppings }
}
