import { useEffect, useRef, useState } from 'react'
import { business } from '../config/business'

/** Menu da conta no topo do painel. */

interface UserMenuProps {
  readonly onOpenAccount: () => void
  readonly onOpenSettings: () => void
  /** Encerra a sessão da loja e volta para a tela de login. */
  readonly onSignOut: () => void
  /** E-mail de quem está logado, para não haver dúvida de qual conta é. */
  readonly email: string
  /** Variante do topo escuro do celular. */
  readonly tone?: 'light' | 'dark'
}

export function UserMenu({
  onOpenAccount,
  onOpenSettings,
  onSignOut,
  email,
  tone = 'light',
}: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const select = (action: () => void) => {
    setOpen(false)
    action()
  }

  const dark = tone === 'dark'

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors ${
          dark ? 'hover:bg-white/10' : 'hover:bg-acai-50'
        }`}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-acai-800 text-xs font-extrabold text-white">
          {business.shortName}
        </span>
        <span className="hidden text-left sm:block">
          <span className={`block text-xs font-bold ${dark ? 'text-white' : 'text-ink'}`}>Admin</span>
          <span className={`block text-[11px] ${dark ? 'text-acai-200' : 'text-muted'}`}>
            {business.name}
          </span>
        </span>
        <ChevronIcon className={dark ? 'text-acai-200' : 'text-muted'} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Conta"
          className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-acai-100 bg-white py-1.5 text-ink shadow-xl shadow-acai-950/10"
        >
          <div className="border-b border-acai-100 px-4 pb-2.5 pt-1.5">
            <p className="text-sm font-extrabold">{business.name}</p>
            <p className="truncate text-xs text-muted">{email}</p>
          </div>

          <MenuItem icon={<UserIcon />} onClick={() => select(onOpenAccount)}>
            Minha conta
          </MenuItem>
          <MenuItem icon={<GearIcon />} onClick={() => select(onOpenSettings)}>
            Configurações
          </MenuItem>

          <div className="mt-1.5 border-t border-acai-100 pt-1.5">
            <a
              href="/"
              role="menuitem"
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-acai-50 hover:text-acai-800"
            >
              <SiteIcon />
              Ver site
            </a>
            <button
              type="button"
              role="menuitem"
              onClick={() => select(onSignOut)}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-muted transition-colors hover:bg-acai-50 hover:text-acai-800"
            >
              <ExitIcon />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuItem({
  icon,
  onClick,
  children,
}: {
  readonly icon: React.ReactNode
  readonly onClick: () => void
  readonly children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-ink transition-colors hover:bg-acai-50"
    >
      <span className="text-acai-500">{icon}</span>
      {children}
    </button>
  )
}

function ChevronIcon({ className }: { readonly className: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`size-4 fill-current ${className}`}>
      <path d="M12 15.5a1 1 0 0 1-.7-.3l-4.5-4.5a1 1 0 1 1 1.4-1.4l3.8 3.8 3.8-3.8a1 1 0 1 1 1.4 1.4l-4.5 4.5a1 1 0 0 1-.7.3Z" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
      <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 1.8c-3.6 0-8 1.8-8 4.4V21h16v-2.8c0-2.6-4.4-4.4-8-4.4Z" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
      <path d="m19.4 13-.1-1 .1-1 1.7-1.3a.7.7 0 0 0 .2-.9l-1.7-2.8a.7.7 0 0 0-.8-.3l-2 .8a7.3 7.3 0 0 0-1.7-1l-.3-2.1a.7.7 0 0 0-.7-.6h-3.3a.7.7 0 0 0-.7.6l-.3 2.1c-.6.2-1.2.6-1.7 1l-2-.8a.7.7 0 0 0-.8.3L2.7 8.8a.7.7 0 0 0 .2.9L4.6 11l-.1 1 .1 1-1.7 1.3a.7.7 0 0 0-.2.9l1.7 2.8c.2.3.5.4.8.3l2-.8c.5.4 1.1.8 1.7 1l.3 2.1c0 .3.3.6.7.6h3.3c.4 0 .7-.3.7-.6l.3-2.1c.6-.2 1.2-.6 1.7-1l2 .8c.3.1.6 0 .8-.3l1.7-2.8a.7.7 0 0 0-.2-.9L19.4 13ZM12 15.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Z" />
    </svg>
  )
}

function ExitIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
      <path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5a1 1 0 1 0 0-2H5V5h5a1 1 0 1 0 0-2Zm6.3 4.3a1 1 0 0 0 0 1.4L17.6 10H10a1 1 0 1 0 0 2h7.6l-1.3 1.3a1 1 0 1 0 1.4 1.4l3-3a1 1 0 0 0 0-1.4l-3-3a1 1 0 0 0-1.4 0Z" />
    </svg>
  )
}

function SiteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 9h-3a15 15 0 0 0-1.2-5.3A8 8 0 0 1 18.9 11ZM12 4.2c.8 1.1 1.6 3.3 1.8 6.8h-3.6c.2-3.5 1-5.7 1.8-6.8ZM5.1 11a8 8 0 0 1 4.2-5.3A15 15 0 0 0 8.1 11h-3Zm0 2h3a15 15 0 0 0 1.2 5.3A8 8 0 0 1 5.1 13ZM12 19.8c-.8-1.1-1.6-3.3-1.8-6.8h3.6c-.2 3.5-1 5.7-1.8 6.8Zm2.7-1.5a15 15 0 0 0 1.2-5.3h3a8 8 0 0 1-4.2 5.3Z" />
    </svg>
  )
}
