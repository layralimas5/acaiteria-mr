import { useCallback, useState } from 'react'
import { CartProvider } from './cart/CartContext'
import { AcaiBuilder } from './components/builder/AcaiBuilder'
import { CartDrawer } from './components/CartDrawer'
import { CupsShowcase } from './components/CupsShowcase'
import { Delivery } from './components/Delivery'
import { FloatingOrder } from './components/FloatingOrder'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Location } from './components/Location'
import { Marquee } from './components/Marquee'

export default function App() {
  const [cartOpen, setCartOpen] = useState(false)
  const [builderVisible, setBuilderVisible] = useState(false)
  /** Tamanho escolhido na vitrine, aplicado no montador. */
  const [presetSizeId, setPresetSizeId] = useState<string | null>(null)

  const pickSize = useCallback((sizeId: string) => {
    setPresetSizeId(sizeId)
    document.getElementById('monte-seu-acai')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const openCart = useCallback(() => setCartOpen(true), [])
  const closeCart = useCallback(() => setCartOpen(false), [])

  return (
    <CartProvider>
      <a
        href="#monte-seu-acai"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-acai-800 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
      >
        Pular para a montagem do pedido
      </a>

      <Header onOpenCart={openCart} />

      <main className="pb-20 sm:pb-0">
        <Hero />
        <Marquee />
        <CupsShowcase onPick={pickSize} />
        <AcaiBuilder
          onOpenCart={openCart}
          onVisibilityChange={setBuilderVisible}
          presetSizeId={presetSizeId}
          onPresetApplied={() => setPresetSizeId(null)}
        />
        <Delivery />
        <Location />
      </main>

      <Footer />

      {/* A barra do builder já ocupa o rodapé do celular quando ele está na tela. */}
      {!builderVisible && <FloatingOrder onOpenCart={openCart} />}

      <CartDrawer open={cartOpen} onClose={closeCart} />
    </CartProvider>
  )
}
