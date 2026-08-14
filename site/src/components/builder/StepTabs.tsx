export interface StepInfo {
  readonly id: number
  readonly label: string
  readonly done: boolean
  readonly hint: string
}

interface StepTabsProps {
  readonly steps: readonly StepInfo[]
  readonly active: number
  readonly onSelect: (step: number) => void
}

/**
 * Trilha de etapas clicável. Toda etapa fica sempre acessível: quem quiser
 * pular complementos e ir direto para o fim é só tocar no nome.
 */
export function StepTabs({ steps, active, onSelect }: StepTabsProps) {
  return (
    <nav aria-label="Etapas da montagem" className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
      <ol className="flex min-w-max items-center gap-2 sm:min-w-0 sm:gap-3">
        {steps.map((step, index) => {
          const isActive = step.id === active

          return (
            <li key={step.id} className="flex items-center gap-2 sm:flex-1 sm:gap-3">
              <button
                type="button"
                onClick={() => onSelect(step.id)}
                aria-current={isActive ? 'step' : undefined}
                className={`group flex flex-1 items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition-all duration-200 sm:px-4 sm:py-3 ${
                  isActive
                    ? 'border-acai-800 bg-acai-800 text-white shadow-lg shadow-acai-900/20'
                    : step.done
                      ? 'border-green-200 bg-green-50 text-green-800 hover:border-green-400'
                      : 'border-acai-100 bg-white text-muted hover:border-acai-300 hover:text-acai-800'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-extrabold ${
                    isActive
                      ? 'bg-white text-acai-900'
                      : step.done
                        ? 'bg-green-600 text-white'
                        : 'bg-acai-50 text-acai-700'
                  }`}
                >
                  {step.done && !isActive ? (
                    <svg viewBox="0 0 20 20" className="size-3 fill-none stroke-current stroke-[3]">
                      <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </span>

                <span className="min-w-0">
                  <span className="block whitespace-nowrap text-sm font-bold leading-tight">{step.label}</span>
                  <span
                    className={`block whitespace-nowrap text-[11px] leading-tight ${
                      isActive ? 'text-acai-100/80' : 'text-muted'
                    }`}
                  >
                    {step.hint}
                  </span>
                </span>
              </button>

              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`hidden h-px w-4 shrink-0 sm:block ${step.done ? 'bg-green-300' : 'bg-acai-100'}`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
