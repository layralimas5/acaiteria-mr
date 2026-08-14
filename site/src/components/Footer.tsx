import { business } from '../config/business'
import { locationLabel, whatsappUrl } from '../lib/order'
import { Logo } from './Logo'

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
            Novidades, sabores e o dia da inauguração saem lá primeiro.
          </p>
        </div>

        <nav aria-label="Links do rodapé">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-acai-300">Navegue</h2>
          <ul className="mt-4 flex flex-col gap-3 text-sm">
            {[
              { href: '#entrega', label: 'Entrega' },
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
                className="text-acai-100/70 transition-colors hover:text-white"
              >
                WhatsApp
              </a>
            </li>
            <li>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-acai-100/70 transition-colors hover:text-white"
              >
                @{business.instagramHandle}
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
