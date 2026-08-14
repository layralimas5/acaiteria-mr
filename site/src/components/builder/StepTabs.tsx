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
 * Trilha de etapas, sempre inteira na tela: no celular vira uma régua de
 * números conectados; a partir de sm, abas com nome e resumo da escolha.
 * Toda etapa é clicável — quem quiser pular direto para o fim, pode.
 */
export function StepTabs({ steps, active, onSelect }: StepTabsProps) {
  const current = steps.find((step) => step.id === active)

  return (
    <nav aria-label="Etapas da montagem">
      {/* Celular: régua de números. */}
      <div className="sm:hidden">
        <ol className="flex items-center">
          {steps.map((step, index) => {
            const isActive = step.id === active

            return (
              <li key={step.id} className="flex flex-1 items-center last:flex-none">
                <button
                  type="button"
                  onClick={() => onSelect(step.id)}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`Etapa ${step.id}: ${step.label}`}
                  className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-extrabold transition-all duration-200 ${
                    isActive
                      ? 'bg-acai-800 text-white shadow-lg shadow-acai-900/25 ring-4 ring-acai-100'
                      : step.done
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-acai-400 ring-1 ring-acai-200'
                  }`}
                >
                  {step.done && !isActive ? (
                    <svg viewBox="0 0 20 20" className="size-4 fill-none stroke-current stroke-[3]">
                      <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </button>

                {index < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`mx-1 h-0.5 flex-1 rounded-full ${step.done ? 'bg-green-400' : 'bg-acai-200'}`}
                  />
                )}
              </li>
            )
          })}
        </ol>

        <p className="mt-3 flex items-baseline gap-2">
          <span className="text-sm font-extrabold text-ink">{current?.label}</span>
          <span className="truncate text-xs text-muted">
            etapa {active} de {steps.length} · {current?.hint}
          </span>
        </p>
      </div>

      {/* Tablet e desktop: abas com nome e escolha atual. */}
      <ol className="hidden gap-2 sm:grid sm:grid-cols-5">
        {steps.map((step) => {
          const isActive = step.id === active

          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onSelect(step.id)}
                aria-current={isActive ? 'step' : undefined}
                className={`flex w-full items-center gap-2 rounded-2xl border px-2.5 py-2.5 text-left transition-all duration-200 ${
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
                  <span className="block text-[11px] font-bold leading-tight">{step.label}</span>
                  <span
                    className={`block truncate text-[10px] leading-tight ${
                      isActive ? 'text-acai-100/80' : 'text-muted'
                    }`}
                  >
                    {step.hint}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
