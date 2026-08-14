import { useEffect, useState } from 'react'
import { useCart } from '../cart/CartContext'
import { orderLabel, orderUrl } from '../lib/order'

interface FloatingOrderProps {
  readonly onOpenCart: () => void
}

/** CTA fixo no rodapé em telas pequenas — aparece depois do hero. */
export function FloatingOrder({ onOpenCart }: FloatingOrderProps) {
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
          onClick={onOpenCart}
          tabIndex={visible ? 0 : -1}
          aria-hidden={!visible}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-acai-800 px-6 py-3.5 text-sm font-bold text-white"
        >
          Ver pedido ({count}) • {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </button>
      ) : (
        <a
          href={orderUrl()}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={visible ? 0 : -1}
          aria-hidden={!visible}
          className="flex w-full items-center justify-center rounded-full bg-acai-800 px-6 py-3.5 text-sm font-bold text-white"
        >
          {orderLabel()}
        </a>
      )}
    </div>
  )
}
