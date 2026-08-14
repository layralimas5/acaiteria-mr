import { useEffect, useState } from 'react'
import { business } from '../config/business'
import { useCart } from '../cart/CartContext'
import { locationLabel } from '../lib/order'
import { Logo } from './Logo'
import { OrderButton } from './OrderButton'

const links = [
  { href: '#monte-seu-acai', label: 'Monte seu açaí' },
  { href: '#entrega', label: 'Entrega' },
  { href: '#onde-estamos', label: 'Área de entrega' },
] as const

interface HeaderProps {
  readonly onOpenCart: () => void
}

export function Header({ onOpenCart }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { count } = useCart()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const hasBackdrop = scrolled || isOpen

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        hasBackdrop
          ? 'border-b border-white/10 bg-acai-950/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:h-20">
        <a href="#topo" aria-label={`${business.name}, ir para o topo`} className="flex items-center">
          <Logo priority className="size-12 sm:size-14" />
        </a>

        <nav aria-label="Navegação principal" className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-acai-100 transition-colors hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {count > 0 && (
            <button
              type="button"
              onClick={onOpenCart}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Pedido
              <span className="grid size-5 place-items-center rounded-full bg-white text-xs font-extrabold text-acai-900">
                {count}
              </span>
            </button>
          )}
          <OrderButton variant="light" className="hidden sm:inline-flex" />
          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            aria-expanded={isOpen}
            aria-controls="menu-mobile"
            aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
            className="grid size-10 place-items-center rounded-xl border border-white/25 text-white lg:hidden"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 stroke-current stroke-2">
              {isOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <nav id="menu-mobile" aria-label="Navegação mobile" className="border-t border-white/10 lg:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col px-5 py-2">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-lg px-2 py-3 text-sm font-medium text-white hover:bg-white/10"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="py-3">
              <OrderButton variant="light" className="w-full" />
            </li>
            <li className="pb-3 text-xs text-acai-200">{locationLabel()}</li>
          </ul>
        </nav>
      )}
    </header>
  )
}
