import { business } from '../config/business'
import { whatsappUrl } from '../lib/order'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-acai-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-acai-800 text-sm font-extrabold tracking-widest text-white">
              MR
            </span>
            <span className="text-base font-bold text-ink">{business.name}</span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-muted">{business.tagline}</p>
        </div>

        <nav aria-label="Links do rodapé" className="flex flex-col gap-3 text-sm">
          <a
            href={`https://instagram.com/${business.instagramHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-muted transition-colors hover:text-acai-800"
          >
            @{business.instagramHandle}
          </a>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-muted transition-colors hover:text-acai-800"
          >
            WhatsApp
          </a>
          <a href="#produtos" className="font-medium text-muted transition-colors hover:text-acai-800">
            Cardápio
          </a>
        </nav>
      </div>

      <div className="border-t border-acai-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {business.name}. Todos os direitos reservados.
          </p>
          <p>
            Desenvolvido por{' '}
            <a
              href="https://limadigitalstudio.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-acai-800 hover:underline"
            >
              Layra Lima
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
