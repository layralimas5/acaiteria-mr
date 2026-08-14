import type { ReactNode } from 'react'

interface StepSectionProps {
  readonly step: number
  readonly title: string
  readonly subtitle: string
  readonly done: boolean
  readonly children: ReactNode
}

/** Cabeçalho numerado de cada etapa, com marca de concluído. */
export function StepSection({ step, title, subtitle, done, children }: StepSectionProps) {
  return (
    <section className="border-t border-acai-100 py-8 first:border-t-0 first:pt-0">
      <header className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-extrabold transition-colors ${
            done ? 'bg-green-600 text-white' : 'bg-acai-100 text-acai-800'
          }`}
        >
          {done ? (
            <svg viewBox="0 0 20 20" className="size-4 fill-none stroke-current stroke-[2.5]">
              <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            step
          )}
        </span>

        <div className="min-w-0">
          <h3 className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">{title}</h3>
          <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
        </div>
      </header>

      <div className="mt-5">{children}</div>
    </section>
  )
}
