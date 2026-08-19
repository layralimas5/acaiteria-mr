interface FreeToppingsMeterProps {
  /** Soma das cotas grátis de todas as categorias. */
  readonly limit: number
  /** Quantos da cota já foram usados. */
  readonly freeUsed: number
  /** Quantos passaram da cota e entram como adicional. */
  readonly paid: number
}

/**
 * Cota de complementos grátis em bolinhas: cheias = usadas, vazias = ainda
 * disponíveis, roxas = passaram do limite e entram como adicional.
 */
export function FreeToppingsMeter({ limit, freeUsed, paid }: FreeToppingsMeterProps) {
  const extra = paid
  const used = Math.min(freeUsed, limit)

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: limit }, (_, index) => (
          <span
            key={index}
            className={`size-2.5 rounded-full transition-all duration-300 ${
              index < used ? 'scale-110 bg-green-500' : 'bg-acai-200'
            }`}
          />
        ))}
        {Array.from({ length: extra }, (_, index) => (
          <span key={`extra-${index}`} className="size-2.5 rounded-full bg-acai-700" />
        ))}
      </div>

      <p className="text-sm font-semibold">
        {extra > 0 ? (
          <>
            <span className="text-green-700">{limit} grátis</span>
            <span className="text-muted"> + </span>
            <span className="text-acai-800">
              {extra} {extra === 1 ? 'adicional' : 'adicionais'}
            </span>
          </>
        ) : (
          <span className="text-muted">
            <span className="text-ink">{used}</span> de {limit} grátis
            {used < limit && <span className="text-muted"> · faltam {limit - used}</span>}
          </span>
        )}
      </p>
    </div>
  )
}
