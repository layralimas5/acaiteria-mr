import { business } from '../config/business'
import { locationLabel, whatsappDisplay, whatsappUrl } from '../lib/order'
import { Logo } from './Logo'

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-current">
      <path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.94.53 3.76 1.46 5.32L2 22l4.98-1.6a9.8 9.8 0 0 0 5.06 1.4h.01c5.43 0 9.84-4.4 9.84-9.84 0-2.63-1.03-5.1-2.89-6.96A9.77 9.77 0 0 0 12.04 2Zm0 17.96h-.01a8.2 8.2 0 0 1-4.16-1.14l-.3-.18-3.1 1 1.02-3.02-.2-.31a8.13 8.13 0 0 1-1.25-4.35c0-4.5 3.68-8.17 8.2-8.17 2.19 0 4.25.86 5.8 2.4a8.13 8.13 0 0 1 2.4 5.78c0 4.51-3.68 8.18-8.2 8.18Zm4.5-6.12c-.25-.13-1.46-.72-1.68-.8-.23-.08-.39-.12-.55.13s-.64.8-.78.96c-.14.16-.29.18-.53.06a6.7 6.7 0 0 1-3.35-2.92c-.25-.43.25-.4.72-1.33.08-.16.04-.3-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.43.06-.65.3-.22.25-.85.84-.85 2.04s.88 2.36 1 2.53c.12.16 1.72 2.63 4.18 3.69 1.55.67 2.16.73 2.94.61.47-.07 1.46-.6 1.66-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.46-.29Z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current stroke-[1.8]">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function Footer() {
  const year = new Date().getFullYear()
  const instagramUrl = `https://instagram.com/${business.instagramHandle}`

  return (
    <footer className="relative isolate overflow-hidden bg-acai-950 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-32 size-[420px] rounded-full bg-acai-600/25 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <Logo className="size-16" />
          <p className="mt-4 max-w-xs text-sm text-acai-100/70">{business.tagline}</p>

          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-3 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/15 transition-colors hover:animate-pulse-soft hover:bg-white/20"
          >
            <InstagramIcon />
            Segue a gente no Instagram
          </a>
          <p className="mt-2 text-xs text-acai-100/60">
            Novidades, sabores e promoções saem lá primeiro.
          </p>
        </div>

        <nav aria-label="Links do rodapé">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-acai-300">Navegue</h2>
          <ul className="mt-4 flex flex-col gap-3 text-sm">
            {[
              { href: '#monte-seu-acai', label: 'Monte seu pedido' },
              { href: '#entrega', label: 'Entrega' },
              { href: '#a-marca', label: 'A marca' },
              { href: '#depoimentos', label: 'Depoimentos' },
              { href: '#onde-estamos', label: 'Área de entrega' },
            ].map((link) => (
              <li key={link.href}>
                <a href={link.href} className="text-acai-100/70 transition-colors hover:text-white">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-acai-300">Fale com a gente</h2>
          <ul className="mt-4 flex flex-col gap-3 text-sm">
            <li>
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-acai-100/70 transition-colors hover:text-white"
              >
                <WhatsAppIcon />
                {whatsappDisplay()}
              </a>
            </li>
          </ul>
          <address className="mt-4 not-italic text-sm leading-relaxed text-acai-100/70">
            {business.deliveryOnly && (
              <>
                Só delivery
                <br />
              </>
            )}
            {locationLabel()}
          </address>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-acai-100/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {business.name}. Todos os direitos reservados.
          </p>
          <p>
            Desenvolvido por{' '}
            <a
              href="https://limadigitalstudio.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white hover:underline"
            >
              Layra Lima
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
