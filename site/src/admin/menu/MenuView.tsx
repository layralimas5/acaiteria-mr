import { useCallback, useState } from 'react'
import { createCategory, createProduct } from '../../catalog/api'
import { useCatalog } from '../../catalog/useCatalog'
import { totalFreeToppings } from '../../catalog/types'
import { errorMessage } from '../../lib/supabase'
import { CategoryEditor, CategoryForm } from './CategoryEditor'
import { ProductEditor, ProductForm } from './ProductEditor'
import { ErrorNote, GhostButton, PrimaryButton } from './ui'

/**
 * Cardápio: tudo que o cliente vê no montador.
 *
 * A loja cadastra aqui os produtos (açaí, sorvete), os tamanhos e preços, as
 * bases e sabores, e as categorias de complemento com a cota grátis de cada
 * uma. Nada disso vem de fábrica e nada exige publicar o site de novo: salvou,
 * está no ar.
 *
 * Não confundir com Estoque: aqui é o que se vende, lá é o insumo que produz.
 */

export function MenuView() {
  const { catalog, loading, error, reload } = useCatalog()
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [addingProduct, setAddingProduct] = useState(false)
  const [addingCategory, setAddingCategory] = useState(false)

  /**
   * Toda gravação passa por aqui: trava a tela, mostra o erro em vez de sumir
   * em silêncio e recarrega o cardápio no fim, para o que está na tela ser o
   * que está no banco.
   */
  const run = useCallback(
    (action: () => Promise<void>) => {
      setBusy(true)
      setActionError(null)

      void action()
        .then(() => reload())
        .catch((cause: unknown) => setActionError(errorMessage(cause)))
        .finally(() => setBusy(false))
    },
    [reload],
  )

  const freeTotal = totalFreeToppings(catalog.categories)

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Cardápio</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            O que o cliente monta no site. Salvou aqui, está no ar na hora, sem publicar de novo.
          </p>
        </div>
        {busy && <span className="text-xs font-bold text-acai-700">Salvando...</span>}
      </div>

      <ErrorNote message={actionError ?? error} />

      {loading ? (
        <p className="mt-6 text-sm text-muted">Carregando o cardápio...</p>
      ) : (
        <>
          <section className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-extrabold text-ink">
                Produtos
                <span className="ml-2 font-semibold text-muted">({catalog.products.length})</span>
              </h2>
              <PrimaryButton onClick={() => setAddingProduct((value) => !value)} disabled={busy}>
                {addingProduct ? 'Fechar' : 'Novo produto'}
              </PrimaryButton>
            </div>

            {addingProduct && (
              <div className="mt-3 overflow-hidden rounded-card border border-acai-200 bg-white shadow-sm">
                <ProductForm
                  onCancel={() => setAddingProduct(false)}
                  onSave={(draft) => {
                    run(() => createProduct(draft, catalog.products))
                    setAddingProduct(false)
                  }}
                />
              </div>
            )}

            {catalog.products.length === 0 && !addingProduct ? (
              <EmptyState
                title="Nenhum produto cadastrado"
                text="Comece pelo produto (Açaí, Sorvete), depois cadastre os tamanhos com preço e as bases. Enquanto não houver produto com tamanho, o site avisa que o cardápio está em montagem."
                action="Cadastrar o primeiro produto"
                onAction={() => setAddingProduct(true)}
              />
            ) : (
              <div className="mt-3 space-y-3">
                {catalog.products.map((product) => (
                  <ProductEditor
                    key={product.id}
                    product={product}
                    siblings={catalog.products}
                    run={run}
                    busy={busy}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-extrabold text-ink">
                  Complementos
                  <span className="ml-2 font-semibold text-muted">
                    ({catalog.toppings.length} em {catalog.categories.length}{' '}
                    {catalog.categories.length === 1 ? 'categoria' : 'categorias'})
                  </span>
                </h2>
                {catalog.categories.length > 0 && (
                  <p className="mt-1 text-xs text-muted">
                    O site anuncia {freeTotal}{' '}
                    {freeTotal === 1 ? 'complemento grátis' : 'complementos grátis'} no total,
                    somando as categorias.
                  </p>
                )}
              </div>
              <PrimaryButton onClick={() => setAddingCategory((value) => !value)} disabled={busy}>
                {addingCategory ? 'Fechar' : 'Nova categoria'}
              </PrimaryButton>
            </div>

            {addingCategory && (
              <div className="mt-3 overflow-hidden rounded-card border border-acai-200 bg-white shadow-sm">
                <CategoryForm
                  onCancel={() => setAddingCategory(false)}
                  onSave={(values) => {
                    run(() => createCategory(values, catalog.categories))
                    setAddingCategory(false)
                  }}
                />
              </div>
            )}

            {catalog.categories.length === 0 && !addingCategory ? (
              <EmptyState
                title="Nenhuma categoria de complemento"
                text="Categorias organizam o que vai por cima: frutas, cremes, crocantes, caldas. A cota grátis e o limite são da categoria, e é o que o cliente lê no montador."
                action="Criar a primeira categoria"
                onAction={() => setAddingCategory(true)}
              />
            ) : (
              <div className="mt-3 space-y-3">
                {catalog.categories.map((category) => (
                  <CategoryEditor
                    key={category.id}
                    category={category}
                    siblings={catalog.categories}
                    toppings={catalog.toppingsByCategory(category.id)}
                    run={run}
                    busy={busy}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </>
  )
}

function EmptyState({
  title,
  text,
  action,
  onAction,
}: {
  readonly title: string
  readonly text: string
  readonly action: string
  readonly onAction: () => void
}) {
  return (
    <div className="mt-3 rounded-card border border-dashed border-acai-200 bg-white p-6 text-center">
      <p className="text-sm font-extrabold text-ink">{title}</p>
      <p className="mx-auto mt-1.5 max-w-lg text-sm text-muted">{text}</p>
      <div className="mt-4 flex justify-center">
        <GhostButton onClick={onAction}>{action}</GhostButton>
      </div>
    </div>
  )
}
