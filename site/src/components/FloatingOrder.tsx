import { useEffect, useState } from 'react'
import { hasIfood, orderUrl } from '../lib/order'

/** CTA fixo no rodapé em telas pequenas — aparece depois do hero. */
export function FloatingOrder() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-acai-100 bg-white/95 p-4 backdrop-blur-md transition-transform duration-300 sm:hidden ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <a
        href={orderUrl()}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={visible ? 0 : -1}
        aria-hidden={!visible}
        className="flex w-full items-center justify-center rounded-full bg-acai-800 px-6 py-3.5 text-sm font-bold text-white"
      >
        {hasIfood() ? 'Peça no iFood' : 'Pedir no WhatsApp'}
      </a>
    </div>
  )
}
