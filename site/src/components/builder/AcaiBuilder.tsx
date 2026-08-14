import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../../cart/CartContext'
import { acaiBases, cupSizes, toppingCategories, toppingsByCategory } from '../../data/builder'
import type { AcaiBase, CupSize, Topping } from '../../data/builder'
import type { BuildSelection } from '../../lib/builder'
import { emptySelection, priceBuild, toggleTopping, toppingsLabel } from '../../lib/builder'
import { MobileOrderBar } from './MobileOrderBar'
import { BaseSelector } from './BaseSelector'
import { OrderSummary } from './OrderSummary'
import { SizeSelector } from './SizeSelector'
import { StepSection } from './StepSection'
import { ToppingCategory } from './ToppingCategory'

interface AcaiBuilderProps {
  readonly onOpenCart: () => void
  /** Avisa o App para esconder o CTA flutuante enquanto a barra do builder está no ar. */
  readonly onVisibilityChange: (visible: boolean) => void
}

export function AcaiBuilder({ onOpenCart, onVisibilityChange }: AcaiBuilderProps) {
  const { addBuild, count } = useCart()
  const [selection, setSelection] = useState<BuildSelection>(emptySelection)
  const [added, setAdded] = useState(false)
  const [inView, setInView] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry?.isIntersecting ?? false
        setInView(visible)
        onVisibilityChange(visible)
      },
      { rootMargin: '-80px 0px -120px 0px' },
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [onVisibilityChange])

  const pricing = useMemo(() => priceBuild(selection), [selection])

  const freeIds = useMemo(
    () => selection.toppings.slice(0, pricing.freeLimit).map((topping) => topping.id),
    [selection.toppings, pricing.freeLimit],
  )
  const selectedIds = useMemo(() => selection.toppings.map((topping) => topping.id), [selection.toppings])
  const freeRemaining = Math.max(0, pricing.freeLimit - selection.toppings.length)

  const selectSize = useCallback((size: CupSize) => {
    setSelection((current) => ({ ...current, size }))
  }, [])

  const selectBase = useCallback((base: AcaiBase) => {
    setSelection((current) => ({ ...current, base }))
  }, [])

  const handleToggleTopping = useCallback((topping: Topping) => {
    setSelection((current) => ({ ...current, toppings: toggleTopping(current.toppings, topping) }))
  }, [])

  const handleAdd = useCallback(() => {
    const item = addBuild(selection)
    if (!item) return

    setSelection(emptySelection)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 2600)
  }, [addBuild, selection])

  const reset = useCallback(() => setSelection(emptySelection), [])

  return (
    <section ref={sectionRef} id="monte-seu-acai" className="scroll-mt-24 bg-acai-50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-acai-700">Monte seu açaí</span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Do seu jeito, do tamanho que você quiser
          </h2>
          <p className="mt-3 text-base text-muted">
            Escolha o copo, a base e os complementos. O preço aparece na hora, sem surpresa no fim.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div className="rounded-card border border-acai-100 bg-white p-6 sm:p-8">
            <StepSection
              step={1}
              title="Escolha seu tamanho"
              subtitle="Cada tamanho já vem com uma cota de complementos grátis."
              done={Boolean(selection.size)}
            >
              <SizeSelector sizes={cupSizes} selected={selection.size} onSelect={selectSize} />
            </StepSection>

            <StepSection
              step={2}
              title="Escolha sua base"
              subtitle="Uma base por copo."
              done={Boolean(selection.base)}
            >
              <BaseSelector bases={acaiBases} selected={selection.base} onSelect={selectBase} />
            </StepSection>

            <StepSection
              step={3}
              title="Escolha seus complementos"
              subtitle={toppingsLabel(selection, pricing)}
              done={selection.toppings.length > 0}
            >
              {!selection.size && (
                <p className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                  Escolha o tamanho primeiro para saber quantos complementos entram de graça.
                </p>
              )}

              <div className="space-y-7">
                {toppingCategories.map((category) => (
                  <ToppingCategory
                    key={category.id}
                    category={category}
                    toppings={toppingsByCategory(category.id)}
                    selectedIds={selectedIds}
                    freeIds={freeIds}
                    freeRemaining={freeRemaining}
                    disabled={!selection.size}
                    onToggle={handleToggleTopping}
                  />
                ))}
              </div>
            </StepSection>

            <StepSection
              step={4}
              title="Finalize seu açaí"
              subtitle="Confira o resumo e mande pra cozinha."
              done={false}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!selection.size || !selection.base}
                  className="rounded-full bg-acai-800 px-6 py-3 text-sm font-bold text-white transition-colors hover:animate-pulse-soft hover:bg-acai-900 disabled:cursor-not-allowed disabled:bg-acai-200 disabled:text-acai-800"
                >
                  Adicionar ao carrinho
                </button>

                {count > 0 && (
                  <button
                    type="button"
                    onClick={onOpenCart}
                    className="rounded-full border border-acai-200 px-6 py-3 text-sm font-bold text-acai-800 transition-colors hover:bg-acai-50"
                  >
                    Ver pedido ({count})
                  </button>
                )}
              </div>

              <AnimatePresence>
                {added && (
                  <motion.p
                    role="status"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
                  >
                    Açaí adicionado ao pedido. Quer montar outro?
                  </motion.p>
                )}
              </AnimatePresence>
            </StepSection>
          </div>

          <div className="hidden lg:block">
            <OrderSummary selection={selection} pricing={pricing} onAdd={handleAdd} onReset={reset} />
          </div>
        </div>
      </div>

      {inView && (
        <MobileOrderBar
          selection={selection}
          pricing={pricing}
          cartCount={count}
          onAdd={handleAdd}
          onOpenCart={onOpenCart}
        />
      )}
    </section>
  )
}
