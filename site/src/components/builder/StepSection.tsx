import type { ReactNode } from 'react'

interface StepSectionProps {
  readonly step: number
  readonly title: string
  readonly subtitle: string
  readonly done: boolean
  /** Etapa ainda bloqueada por uma escolha anterior. */
  readonly locked?: boolean
  readonly children: ReactNode
}

/**
 * Cada etapa é um ponto da jornada: bolinha numerada à esquerda, trilha
 * vertical ligando à etapa seguinte e o conteúdo recuado à direita.
 */
export function StepSection({ step, title, subtitle, done, locked = false, children }: StepSectionProps) {
  return (
    <section className="relative pb-10 pl-12 last:pb-0 sm:pl-14">
      {/* Trilha que conecta as etapas. */}
      <span
        aria-hidden="true"
        className={`absolute bottom-0 left-[15px] top-10 w-px sm:left-[19px] ${
          done ? 'bg-green-500/40' : 'bg-acai-100'
        }`}
      />

      <span
        aria-hidden="true"
        className={`absolute left-0 top-0 grid size-8 place-items-center rounded-full text-sm font-extrabold transition-all duration-300 sm:size-10 ${
          done
            ? 'bg-green-600 text-white shadow-lg shadow-green-600/25'
            : locked
              ? 'bg-acai-50 text-acai-300 ring-1 ring-acai-100'
              : 'bg-acai-800 text-white shadow-lg shadow-acai-900/20'
        }`}
      >
        {done ? (
          <svg viewBox="0 0 20 20" className="size-4 fill-none stroke-current stroke-[2.5] sm:size-5">
            <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          step
        )}
      </span>

      <header className="min-h-8 sm:min-h-10">
        <h3 className="text-lg font-extrabold leading-tight tracking-tight text-ink sm:text-xl">{title}</h3>
        <p className={`mt-1 text-sm ${done ? 'font-semibold text-green-700' : 'text-muted'}`}>{subtitle}</p>
      </header>

      <div className="mt-5">{children}</div>
    </section>
  )
}
