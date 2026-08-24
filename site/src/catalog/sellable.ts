import { useMemo } from 'react'
import type { Catalog, ProductKind } from './types'
import { emptyCatalog } from './types'
import { useCatalog } from './useCatalog'

/**
 * O cardápio como o cliente enxerga: só o que está à venda hoje.
 *
 * A caixa "No site" do painel decide o que existe para quem visita. Item
 * desmarcado não vira card apagado com um aviso de esgotado: ele some. Um
 * cardápio que anuncia o que não pode vender só cria pergunta no WhatsApp e
 * frustra quem já escolheu.
 *
 * O painel continua vendo tudo — é lá que a loja liga e desliga cada item —,
 * então o filtro mora aqui e não na consulta ao banco.
 */

const sellableProduct = (product: ProductKind): ProductKind => ({
  ...product,
  sizes: product.sizes.filter((size) => size.available),
  bases: product.bases.filter((base) => base.available),
})

/**
 * Produto sem nenhum tamanho no ar não tem preço para mostrar, e sem base não
 * dá para completar a etapa 3: os dois saem junto com os itens desligados.
 */
const isSellable = (product: ProductKind): boolean =>
  product.sizes.length > 0 && product.bases.length > 0

export const sellableCatalog = (catalog: Catalog): Catalog => {
  const products = catalog.products
    .filter((product) => product.available)
    .map(sellableProduct)
    .filter(isSellable)

  const toppings = catalog.toppings.filter((topping) => topping.available)

  // Categoria que ficou sem nenhum complemento no ar vira um título solto com
  // um aviso de vazio. Sem itens, sem seção.
  const categories = catalog.categories.filter((category) =>
    toppings.some((topping) => topping.categoryId === category.id),
  )

  return {
    products,
    categories,
    toppings,
    toppingsByCategory: (categoryId) =>
      toppings.filter((topping) => topping.categoryId === categoryId),
    rules: Object.fromEntries(categories.map((category) => [category.id, category.rule])),
  }
}

interface SellableCatalogState {
  readonly catalog: Catalog
  readonly loading: boolean
  readonly error: string | null
}

/**
 * Versão do `useCatalog` para as telas do site. O painel usa o cru.
 *
 * O resultado é memoizado porque o filtro cria arrays novos: sem isso, toda
 * renderização entregaria um cardápio diferente e derrubaria os `useMemo` que
 * dependem dele lá no montador.
 */
export const useSellableCatalog = (): SellableCatalogState => {
  const { catalog, loading, error } = useCatalog()
  const filtered = useMemo(() => sellableCatalog(catalog), [catalog])
  return { catalog: loading ? emptyCatalog : filtered, loading, error }
}
