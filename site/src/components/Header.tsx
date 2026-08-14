import { useEffect, useState } from 'react'
import { business } from '../config/business'
import { openStatus } from '../lib/order'
import { OrderButton } from './OrderButton'

const links = [
  { href: '#produtos', label: 'Cardápio' },
  { href: '#montar', label: 'Complementos' },
  { href: '#entrega', label: 'Entrega' },
  { href: '#onde-estamos', label: 'Onde estamos' },
] as const

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const status = openStatus(new Date())

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-white/85 backdrop-blur-md transition-colors ${
        scrolled ? 'border-acai-100' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:h-20">
        <a href="#topo" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-acai-800 text-sm font-extrabold tracking-widest text-white">
            MR
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold text-ink">Açaiteria MR</span>
            <span className="text-xs font-medium text-muted">{status.label}</span>
          </span>
        </a>

        <nav aria-label="Navegação principal" className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-acai-50 hover:text-acai-800"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <OrderButton className="hidden sm:inline-flex" />
          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            aria-expanded={isOpen}
            aria-controls="menu-mobile"
            aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
            className="grid size-10 place-items-center rounded-xl border border-acai-100 text-acai-800 lg:hidden"
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
        <nav id="menu-mobile" aria-label="Navegação mobile" className="border-t border-acai-100 bg-white lg:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col px-5 py-2">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-lg px-2 py-3 text-sm font-medium text-ink hover:bg-acai-50"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="py-3">
              <OrderButton className="w-full" />
            </li>
            <li className="pb-3 text-xs text-muted">
              {business.address.street} — {business.address.district}
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
