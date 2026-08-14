import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../../cart/CartContext'
import { acaiBases, cupSizes, toppingCategories, toppingsByCategory } from '../../data/builder'
import type { AcaiBase, CupSize, Topping } from '../../data/builder'
import type { BuildSelection } from '../../lib/builder'
import { emptySelection, priceBuild, toggleTopping } from '../../lib/builder'
import { formatPrice } from '../../lib/order'
import { MobileOrderBar } from './MobileOrderBar'
import { BaseSelector } from './BaseSelector'
import { FreeToppingsMeter } from './FreeToppingsMeter'
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

  const sizeDone = Boolean(selection.size)
  const baseDone = Boolean(selection.base)
  const toppingsDone = selection.toppings.length > 0
  const doneCount = [sizeDone, baseDone, toppingsDone].filter(Boolean).length

  return (
    <section
      ref={sectionRef}
      id="monte-seu-acai"
      className="scroll-mt-24 bg-gradient-to-b from-acai-50 to-white py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-acai-700">Monte seu açaí</span>
            <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
              Do seu jeito, do tamanho que você quiser
            </h2>
            <p className="mt-3 text-base text-muted">
              Escolha o copo, a base e os complementos. O preço aparece na hora, sem surpresa no fim.
            </p>
          </div>

          <div className="shrink-0 sm:text-right">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-acai-700">
              {doneCount} de 3 escolhas
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-acai-100 sm:w-44">
              <motion.div
                className="h-full rounded-full bg-acai-800"
                initial={false}
                animate={{ width: `${(doneCount / 3) * 100}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div className="rounded-card border border-acai-100 bg-white p-5 pb-40 shadow-sm sm:p-8 lg:pb-8">
            <StepSection
              step={1}
              title="Escolha seu tamanho"
              subtitle={
                sizeDone
                  ? `${selection.size?.volume} · ${pricing.freeLimit} complementos grátis`
                  : 'Cada tamanho já vem com uma cota de complementos grátis.'
              }
              done={sizeDone}
            >
              <SizeSelector sizes={cupSizes} selected={selection.size} onSelect={selectSize} />
            </StepSection>

            <StepSection
              step={2}
              title="Escolha sua base"
              subtitle={baseDone ? (selection.base?.name ?? '') : 'Uma base por copo.'}
              done={baseDone}
              locked={!sizeDone}
            >
              <BaseSelector bases={acaiBases} selected={selection.base} onSelect={selectBase} />
            </StepSection>

            <StepSection
              step={3}
              title="Escolha seus complementos"
              subtitle={
                sizeDone
                  ? 'Os primeiros entram na cota grátis. Depois disso, cada um soma no total.'
                  : 'Disponível depois que você escolher o tamanho.'
              }
              done={toppingsDone}
              locked={!sizeDone}
            >
              {sizeDone ? (
                <div className="mb-6 rounded-2xl border border-acai-100 bg-acai-50/60 px-4 py-3">
                  <FreeToppingsMeter limit={pricing.freeLimit} chosen={selection.toppings.length} />
                </div>
              ) : (
                <p className="mb-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                  Escolha o tamanho primeiro para saber quantos complementos entram de graça.
                </p>
              )}

              <div className="space-y-8">
                {toppingCategories.map((category) => (
                  <ToppingCategory
                    key={category.id}
                    category={category}
                    toppings={toppingsByCategory(category.id)}
                    selectedIds={selectedIds}
                    freeIds={freeIds}
                    freeRemaining={freeRemaining}
                    disabled={!sizeDone}
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
              locked={!sizeDone || !baseDone}
            >
              <div className="rounded-card bg-acai-900 p-5 text-white">
                <div className="flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-acai-200">Total</p>
                    <p className="mt-1 text-3xl font-extrabold tracking-tight">
                      {formatPrice(pricing.totalPrice)}
                    </p>
                  </div>
                  <p className="pb-1.5 text-right text-xs text-acai-100/75">
                    {selection.size?.volume ?? 'tamanho'} ·{' '}
                    {selection.toppings.length > 0
                      ? `${selection.toppings.length} complementos`
                      : 'sem complementos'}
                  </p>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={!sizeDone || !baseDone}
                    className="flex-1 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-acai-900 transition-colors hover:animate-pulse-soft hover:bg-acai-50 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/50"
                  >
                    Adicionar ao carrinho
                  </button>

                  {count > 0 && (
                    <button
                      type="button"
                      onClick={onOpenCart}
                      className="rounded-full border border-white/25 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
                    >
                      Ver pedido ({count})
                    </button>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {added && (
                  <motion.p
                    role="status"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
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
