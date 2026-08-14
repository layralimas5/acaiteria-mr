import { useMemo, useState } from 'react'
import { categories, products } from '../data/products'
import type { ProductCategory } from '../data/products'
import { ProductCard } from './ProductCard'

type Filter = ProductCategory | 'todos'

const filters: readonly { readonly id: Filter; readonly label: string }[] = [
  { id: 'todos', label: 'Todos' },
  ...categories.map((category) => ({ id: category.id as Filter, label: category.label })),
]

export function Products() {
  const [filter, setFilter] = useState<Filter>('todos')

  const visible = useMemo(
    () => (filter === 'todos' ? products : products.filter((product) => product.category === filter)),
    [filter],
  )

  return (
    <section id="produtos" className="scroll-mt-24 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-acai-700">Cardápio</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Escolha o seu tamanho
            </h2>
            <p className="mt-3 max-w-lg text-base text-muted">
              Todo açaí é batido na hora. Os complementos você escolhe na finalização do pedido.
            </p>
          </div>
        </div>

        <div role="tablist" aria-label="Filtrar produtos" className="mt-8 flex flex-wrap gap-2">
          {filters.map((item) => {
            const isActive = filter === item.id
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilter(item.id)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-acai-800 text-white'
                    : 'border border-acai-100 text-muted hover:border-acai-300 hover:text-acai-800'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {visible.length === 0 && (
          <p className="mt-10 rounded-2xl border border-dashed border-acai-200 p-10 text-center text-sm text-muted">
            Nenhum produto nessa categoria por enquanto.
          </p>
        )}
      </div>
    </section>
  )
}
