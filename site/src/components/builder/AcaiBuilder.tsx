import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../../cart/CartContext'
import { productKinds, toppingCategories, toppingsByCategory } from '../../data/builder'
import type { AcaiBase, CupSize, ProductKind, Topping } from '../../data/builder'
import type { BuildSelection } from '../../lib/builder'
import { emptySelection, priceBuild, toggleTopping } from '../../lib/builder'
import { formatPrice } from '../../lib/order'
import { MobileOrderBar } from './MobileOrderBar'
import { BaseSelector } from './BaseSelector'
import { FreeToppingsMeter } from './FreeToppingsMeter'
import { OrderSummary } from './OrderSummary'
import { ProductSelector } from './ProductSelector'
import { SizeSelector } from './SizeSelector'
import { StepPanel } from './StepPanel'
import { StepTabs } from './StepTabs'
import type { StepInfo } from './StepTabs'
import { ToppingCategory } from './ToppingCategory'

interface AcaiBuilderProps {
  readonly onOpenCart: () => void
  /** Avisa o App para esconder o CTA flutuante enquanto a barra do builder está no ar. */
  readonly onVisibilityChange: (visible: boolean) => void
}

const LAST_STEP = 5

export function AcaiBuilder({ onOpenCart, onVisibilityChange }: AcaiBuilderProps) {
  const { addBuild, count } = useCart()
  const [selection, setSelection] = useState<BuildSelection>(emptySelection)
  const [step, setStep] = useState(1)
  const [added, setAdded] = useState(false)
  const [inView, setInView] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

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

  const goToStep = useCallback((next: number) => {
    setStep(next)
    // Ao trocar de etapa, sobe o painel deixando a trilha de etapas à vista
    // logo abaixo do menu fixo.
    window.requestAnimationFrame(() => {
      const panel = panelRef.current
      if (!panel) return
      const top = panel.getBoundingClientRect().top + window.scrollY - 200
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    })
  }, [])

  /** Trocar de produto zera tamanho e base, que pertencem ao produto anterior. */
  const selectProduct = useCallback((product: ProductKind) => {
    setSelection((current) =>
      current.product?.id === product.id
        ? { ...current, product }
        : { ...current, product, size: null, base: null },
    )
  }, [])

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
    setStep(1)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 2600)
  }, [addBuild, selection])

  const reset = useCallback(() => {
    setSelection(emptySelection)
    setStep(1)
  }, [])

  const product = selection.product
  const productDone = Boolean(product)
  const sizeDone = Boolean(selection.size)
  const baseDone = Boolean(selection.base)
  const toppingsDone = selection.toppings.length > 0
  const canFinish = productDone && sizeDone && baseDone
  const baseLabel = product?.baseLabel ?? 'Base'

  const steps: readonly StepInfo[] = [
    { id: 1, label: 'Produto', done: productDone, hint: product?.name ?? 'açaí ou sorvete' },
    { id: 2, label: 'Tamanho', done: sizeDone, hint: selection.size?.volume ?? 'obrigatório' },
    { id: 3, label: baseLabel, done: baseDone, hint: selection.base?.name ?? 'obrigatório' },
    {
      id: 4,
      label: 'Complementos',
      done: toppingsDone,
      hint: toppingsDone ? `${selection.toppings.length} escolhidos` : 'opcional',
    },
    { id: 5, label: 'Finalizar', done: false, hint: formatPrice(pricing.totalPrice) },
  ]

  return (
    <section
      ref={sectionRef}
      id="monte-seu-acai"
      className="scroll-mt-24 bg-gradient-to-b from-acai-50 to-white py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-xl">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-acai-700">Monte seu pedido</span>
          <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
            Açaí ou sorvete, do jeito que você monta
          </h2>
          <p className="mt-3 text-base text-muted">
            Uma etapa por vez. Pode pular para qualquer uma tocando no nome aqui em cima.
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div className="min-w-0">
            <StepTabs steps={steps} active={step} onSelect={goToStep} />

            <div
              ref={panelRef}
              className="mt-4 rounded-card border border-acai-100 bg-white p-5 pb-32 shadow-sm sm:p-8 lg:pb-8"
            >
              <AnimatePresence mode="wait" initial={false}>
                {step === 1 && (
                  <StepPanel
                    key="product"
                    title="O que você quer hoje?"
                    subtitle={productDone ? (product?.name ?? '') : 'Escolha entre açaí e sorvete.'}
                    done={productDone}
                    footer={
                      <StepFooter
                        onNext={() => goToStep(2)}
                        nextLabel="Escolher o tamanho"
                        nextDisabled={!productDone}
                        disabledHint="Escolha um produto para continuar"
                      />
                    }
                  >
                    <ProductSelector
                      products={productKinds}
                      selected={selection.product}
                      onSelect={selectProduct}
                    />
                  </StepPanel>
                )}

                {step === 2 && (
                  <StepPanel
                    key="size"
                    title="Escolha seu tamanho"
                    subtitle={
                      sizeDone
                        ? `${selection.size?.volume} · ${pricing.freeLimit} complementos grátis`
                        : `Todo tamanho vem com ${product?.sizes[0]?.freeToppings ?? 3} complementos grátis.`
                    }
                    done={sizeDone}
                    footer={
                      <StepFooter
                        onBack={() => goToStep(1)}
                        onNext={() => goToStep(3)}
                        nextLabel={`Escolher ${baseLabel.toLowerCase()}`}
                        nextDisabled={!sizeDone}
                        disabledHint="Escolha um tamanho para continuar"
                      />
                    }
                  >
                    {product ? (
                      <SizeSelector sizes={product.sizes} selected={selection.size} onSelect={selectSize} />
                    ) : (
                      <StepBlocked onGo={() => goToStep(1)} label="Escolha primeiro entre açaí e sorvete." />
                    )}
                  </StepPanel>
                )}

                {step === 3 && (
                  <StepPanel
                    key="base"
                    title={product?.baseStepTitle ?? 'Escolha sua base'}
                    subtitle={baseDone ? (selection.base?.name ?? '') : (product?.baseStepSubtitle ?? '')}
                    done={baseDone}
                    footer={
                      <StepFooter
                        onBack={() => goToStep(2)}
                        onNext={() => goToStep(4)}
                        nextLabel="Escolher complementos"
                        nextDisabled={!baseDone}
                        disabledHint={`Escolha ${baseLabel.toLowerCase()} para continuar`}
                      />
                    }
                  >
                    {product ? (
                      <BaseSelector bases={product.bases} selected={selection.base} onSelect={selectBase} />
                    ) : (
                      <StepBlocked onGo={() => goToStep(1)} label="Escolha primeiro entre açaí e sorvete." />
                    )}
                  </StepPanel>
                )}

                {step === 4 && (
                  <StepPanel
                    key="toppings"
                    title="Escolha seus complementos"
                    subtitle={
                      sizeDone
                        ? `Os ${pricing.freeLimit} primeiros são grátis. A partir daí, cada um soma no total.`
                        : 'Escolha o tamanho antes para liberar os complementos.'
                    }
                    done={toppingsDone}
                    footer={
                      <StepFooter
                        onBack={() => goToStep(3)}
                        onNext={() => goToStep(5)}
                        nextLabel={toppingsDone ? 'Ir para o resumo' : 'Pular complementos'}
                      />
                    }
                  >
                    {sizeDone ? (
                      <div className="mb-6 rounded-2xl border border-acai-100 bg-acai-50/60 px-4 py-3">
                        <FreeToppingsMeter limit={pricing.freeLimit} chosen={selection.toppings.length} />
                      </div>
                    ) : (
                      <StepBlocked
                        onGo={() => goToStep(2)}
                        label="Escolha o tamanho primeiro para liberar os complementos."
                      />
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
                  </StepPanel>
                )}

                {step === 5 && (
                  <StepPanel
                    key="finish"
                    title="Finalize seu pedido"
                    subtitle={
                      canFinish
                        ? 'Confira a montagem e mande pra cozinha.'
                        : 'Falta escolher o que está marcado abaixo.'
                    }
                    done={false}
                  >
                    <div className="space-y-3">
                      <ReviewRow label="Produto" value={product?.name ?? null} onEdit={() => goToStep(1)} />
                      <ReviewRow
                        label="Tamanho"
                        value={selection.size?.volume ?? null}
                        onEdit={() => goToStep(2)}
                      />
                      <ReviewRow
                        label={baseLabel}
                        value={selection.base?.name ?? null}
                        onEdit={() => goToStep(3)}
                      />
                      <ReviewRow
                        label="Complementos"
                        value={
                          selection.toppings.length > 0
                            ? selection.toppings.map((topping) => topping.name).join(', ')
                            : 'nenhum'
                        }
                        optional
                        onEdit={() => goToStep(4)}
                      />
                    </div>

                    <div className="mt-6 rounded-card bg-acai-900 p-5 text-white">
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-acai-200">
                            Total
                          </p>
                          <p className="mt-1 text-3xl font-extrabold tracking-tight">
                            {formatPrice(pricing.totalPrice)}
                          </p>
                        </div>
                        <p className="pb-1.5 text-right text-xs text-acai-100/75">
                          {formatPrice(pricing.basePrice)} base
                          {pricing.additionalPrice > 0 &&
                            ` + ${formatPrice(pricing.additionalPrice)} adicionais`}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={handleAdd}
                          disabled={!canFinish}
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

                    <div className="mt-4 flex items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => goToStep(4)}
                        className="text-sm font-semibold text-muted transition-colors hover:text-acai-800"
                      >
                        Voltar
                      </button>
                      <button
                        type="button"
                        onClick={reset}
                        className="text-xs font-semibold text-muted transition-colors hover:text-acai-800"
                      >
                        Começar de novo
                      </button>
                    </div>
                  </StepPanel>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {added && (
                  <motion.p
                    role="status"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
                  >
                    Adicionado ao pedido. Quer montar outro?
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
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
          onAdd={step === LAST_STEP ? handleAdd : () => goToStep(LAST_STEP)}
          addLabel={step === LAST_STEP ? 'Adicionar' : 'Finalizar'}
          onOpenCart={onOpenCart}
        />
      )}
    </section>
  )
}

function StepBlocked({ onGo, label }: { readonly onGo: () => void; readonly label: string }) {
  return (
    <button
      type="button"
      onClick={onGo}
      className="mb-6 block w-full rounded-2xl bg-amber-50 px-4 py-3 text-left text-sm font-semibold text-amber-800"
    >
      {label} Tocar aqui volta para essa etapa.
    </button>
  )
}

interface StepFooterProps {
  readonly onBack?: () => void
  readonly onNext: () => void
  readonly nextLabel: string
  readonly nextDisabled?: boolean
  readonly disabledHint?: string
}

function StepFooter({ onBack, onNext, nextLabel, nextDisabled = false, disabledHint }: StepFooterProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full flex-col-reverse items-center justify-center gap-3 sm:flex-row">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-full border border-acai-200 px-5 py-3 text-sm font-bold text-acai-800 transition-colors hover:bg-acai-50 sm:w-auto"
          >
            Voltar
          </button>
        )}

        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="w-full rounded-full bg-acai-800 px-8 py-3 text-sm font-bold text-white transition-colors hover:animate-pulse-soft hover:bg-acai-900 disabled:cursor-not-allowed disabled:bg-acai-100 disabled:text-acai-300 sm:w-auto"
        >
          {nextLabel}
        </button>
      </div>

      {nextDisabled && disabledHint && (
        <p className="text-center text-xs font-semibold text-muted">{disabledHint}</p>
      )}
    </div>
  )
}

interface ReviewRowProps {
  readonly label: string
  readonly value: string | null
  readonly optional?: boolean
  readonly onEdit: () => void
}

function ReviewRow({ label, value, optional = false, onEdit }: ReviewRowProps) {
  const missing = value === null

  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 ${
        missing ? 'border-amber-200 bg-amber-50' : 'border-acai-100 bg-white'
      }`}
    >
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-acai-700">{label}</p>
        <p className={`mt-0.5 text-sm font-semibold ${missing ? 'text-amber-800' : 'text-ink'}`}>
          {value ?? (optional ? 'nenhum' : 'falta escolher')}
        </p>
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 text-xs font-bold text-acai-800 underline-offset-4 hover:underline"
      >
        {missing ? 'Escolher' : 'Trocar'}
      </button>
    </div>
  )
}
