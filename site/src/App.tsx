import { useCallback, useEffect, useState } from 'react'
import { CartProvider } from './cart/CartContext'
import { AcaiBuilder } from './components/builder/AcaiBuilder'
import { BrandGallery } from './components/BrandGallery'
import { CupsShowcase } from './components/CupsShowcase'
import { Delivery } from './components/Delivery'
import { FloatingOrder } from './components/FloatingOrder'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Location } from './components/Location'
import { Marquee } from './components/Marquee'
import { OrderConfirm } from './components/OrderConfirm'
import { RepeatOrder } from './components/RepeatOrder'
import { ReviewInvite } from './components/ReviewInvite'
import { Testimonials } from './components/Testimonials'
import { business } from './config/business'
import { hasConfirmed } from './orders/confirmation'
import { readLastOrder } from './orders/lastOrder'
import { hasReviewed } from './orders/review'
import type { LastOrder } from './orders/lastOrder'

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const linkedCode = (param: 'pedido' | 'avaliar'): string | null =>
  new URLSearchParams(window.location.search).get(param)

/**
 * A confirmação de recebimento aparece pelo link que a loja manda ao dar baixa
 * (`?pedido=1000`). Quem já confirmou, ou já avaliou, não vê o card de novo.
 */
const shouldConfirmOrder = (order: LastOrder | null): boolean => {
  if (!order || hasConfirmed(order.code) || hasReviewed(order.code)) return false
  return linkedCode('pedido') === order.code
}

/**
 * O convite de avaliação aparece quando o pedido já teve tempo de chegar: logo
 * depois da confirmação de recebimento, pelo link antigo de avaliação
 * (`?avaliar=1000`), ou sozinho, passado o tempo médio de entrega com folga.
 * Pedido já avaliado ou dispensado não volta.
 */
const shouldInviteReview = (order: LastOrder | null): boolean => {
  if (!order || hasReviewed(order.code)) return false

  if (linkedCode('avaliar') === order.code) return true
  if (linkedCode('pedido') === order.code && hasConfirmed(order.code)) return true

  const minutes = (Date.now() - new Date(order.createdAt).getTime()) / 60_000
  return minutes >= business.delivery.minMinutes + 30
}

export default function App() {
  const [builderVisible, setBuilderVisible] = useState(false)
  /** Sobe a cada pedido de ver a sacola; o montador abre no painel do pedido. */
  const [cartRequest, setCartRequest] = useState(0)
  /** Tamanho escolhido na vitrine, aplicado no montador. */
  const [presetSizeId, setPresetSizeId] = useState<string | null>(null)
  const [lastOrder, setLastOrder] = useState<LastOrder | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [reviewing, setReviewing] = useState(false)

  // O pedido anterior só existe no navegador, então é lido depois da montagem.
  useEffect(() => {
    const stored = readLastOrder()
    setLastOrder(stored)
    setConfirming(shouldConfirmOrder(stored))
    setReviewing(shouldInviteReview(stored))
  }, [])

  /** Confirmou o recebimento: leva direto aos depoimentos, com a nota aberta. */
  const confirmOrder = useCallback(() => {
    setConfirming(false)
    setReviewing(true)
    // Espera o convite entrar na tela antes de rolar até ele.
    requestAnimationFrame(() => scrollTo('avaliar'))
  }, [])

  const pickSize = useCallback((sizeId: string) => {
    setPresetSizeId(sizeId)
    scrollTo('monte-seu-acai')
  }, [])

  const goToCart = useCallback(() => {
    setCartRequest((request) => request + 1)
    scrollTo('monte-seu-acai')
  }, [])

  return (
    <CartProvider>
      <a
        href="#monte-seu-acai"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-acai-800 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
      >
        Pular para a montagem do pedido
      </a>

      <Header onGoToCart={goToCart} />

      <main className="pb-20 sm:pb-0">
        <Hero />
        <Marquee />

        {confirming && lastOrder && (
          <OrderConfirm
            order={lastOrder}
            onConfirmed={confirmOrder}
            onDismiss={() => setConfirming(false)}
          />
        )}

        {lastOrder && (
          <RepeatOrder
            lastOrder={lastOrder}
            onDismiss={() => setLastOrder(null)}
            onRepeated={goToCart}
          />
        )}

        <CupsShowcase onPick={pickSize} />
        <Delivery />
        <AcaiBuilder
          cartRequest={cartRequest}
          knownCustomer={lastOrder?.customer ?? null}
          onVisibilityChange={setBuilderVisible}
          presetSizeId={presetSizeId}
          onPresetApplied={() => setPresetSizeId(null)}
        />
        <BrandGallery />

        {reviewing && lastOrder && (
          <ReviewInvite order={lastOrder} onClose={() => setReviewing(false)} />
        )}

        <Testimonials />
        <Location />
      </main>

      <Footer />

      {/* A barra do builder já ocupa o rodapé do celular quando ele está na tela. */}
      {!builderVisible && <FloatingOrder onGoToCart={goToCart} />}
    </CartProvider>
  )
}
