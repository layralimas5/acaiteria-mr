import { business } from '../config/business'
import { openStatus, whatsappUrl } from '../lib/order'

export function Footer() {
  const year = new Date().getFullYear()
  const status = openStatus(new Date())
  const { address } = business

  return (
    <footer className="relative isolate overflow-hidden bg-acai-950 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-32 size-[420px] rounded-full bg-acai-600/25 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-white text-sm font-extrabold tracking-widest text-acai-900">
              MR
            </span>
            <span className="text-base font-bold">{business.name}</span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-acai-100/70">{business.tagline}</p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-acai-100 ring-1 ring-white/15">
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${status.isOpen ? 'bg-green-400' : 'bg-acai-300'}`}
            />
            {status.label}
          </span>
        </div>

        <nav aria-label="Links do rodapé">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-acai-300">Navegue</h2>
          <ul className="mt-4 flex flex-col gap-3 text-sm">
            {[
              { href: '#produtos', label: 'Cardápio' },
              { href: '#montar', label: 'Complementos' },
              { href: '#entrega', label: 'Entrega' },
              { href: '#onde-estamos', label: 'Onde estamos' },
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
                href={`https://instagram.com/${business.instagramHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-acai-100/70 transition-colors hover:text-white"
              >
                @{business.instagramHandle}
              </a>
            </li>
          </ul>
          <address className="mt-4 not-italic text-sm leading-relaxed text-acai-100/70">
            {address.street}
            <br />
            {address.district} — {address.city}/{address.state}
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
