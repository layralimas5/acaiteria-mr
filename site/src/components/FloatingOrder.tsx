import { useEffect, useState } from 'react'
import { useCart } from '../cart/CartContext'
import { formatPrice } from '../lib/order'

interface FloatingOrderProps {
  readonly onGoToCart: () => void
}

/** CTA fixo no rodapé em telas pequenas, aparece depois do hero. */
export function FloatingOrder({ onGoToCart }: FloatingOrderProps) {
  const [visible, setVisible] = useState(false)
  const { count, total } = useCart()

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const hasItems = count > 0

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-acai-100 bg-white/95 p-4 backdrop-blur-md transition-transform duration-300 sm:hidden ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {hasItems ? (
        <button
          type="button"
          onClick={onGoToCart}
          tabIndex={visible ? 0 : -1}
          aria-hidden={!visible}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-acai-800 px-6 py-3.5 text-sm font-bold text-white"
        >
          Ver pedido ({count}) • {formatPrice(total)}
        </button>
      ) : (
        <a
          href="#monte-seu-acai"
          tabIndex={visible ? 0 : -1}
          aria-hidden={!visible}
          className="flex w-full items-center justify-center rounded-full bg-acai-800 px-6 py-3.5 text-sm font-bold text-white"
        >
          Montar meu pedido
        </a>
      )}
    </div>
  )
}
