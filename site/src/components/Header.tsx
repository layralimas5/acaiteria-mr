import { useEffect, useState } from 'react'
import { business } from '../config/business'
import { useCart } from '../cart/CartContext'
import { locationLabel } from '../lib/order'
import { Logo } from './Logo'

const links = [
  { href: '#monte-seu-acai', label: 'Monte seu pedido' },
  { href: '#entrega', label: 'Entrega' },
  { href: '#onde-estamos', label: 'Área de entrega' },
] as const

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current stroke-[1.8]">
      <path d="M3 4h2l2.4 11.2a1.6 1.6 0 0 0 1.6 1.3h8.2a1.6 1.6 0 0 0 1.6-1.2L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
    </svg>
  )
}

function SystemIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current stroke-[1.8]">
      <rect x="3" y="4" width="18" height="14" rx="2.5" />
      <path d="M8 21h8M12 18v3M7 9h6M7 13h4" strokeLinecap="round" />
    </svg>
  )
}

interface HeaderProps {
  /** Leva o cliente até a seção do pedido, que fica na própria página. */
  readonly onGoToCart: () => void
}

export function Header({ onGoToCart }: HeaderProps) {
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
          <a
            href="/sistema"
            title="Sistema da loja"
            aria-label="Abrir o sistema da loja"
            className="grid size-10 place-items-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/10"
          >
            <SystemIcon />
          </a>

          <button
            type="button"
            onClick={onGoToCart}
            aria-label={count > 0 ? `Ver pedido com ${count} ${count === 1 ? 'item' : 'itens'}` : 'Ver pedido'}
            className="relative grid size-10 place-items-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/10"
          >
            <CartIcon />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-white text-[11px] font-extrabold text-acai-900">
                {count}
              </span>
            )}
          </button>
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
              <a
                href="/sistema"
                className="flex items-center justify-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-bold text-white"
              >
                <SystemIcon />
                Sistema da loja
              </a>
            </li>
            <li className="pb-3 text-xs text-acai-200">{locationLabel()}</li>
          </ul>
        </nav>
      )}
    </header>
  )
}
