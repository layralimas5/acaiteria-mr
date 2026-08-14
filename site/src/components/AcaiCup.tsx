interface AcaiCupProps {
  readonly label: string
  readonly scale?: number
  readonly className?: string
}

/**
 * Ilustração vetorial do copo/pote de açaí.
 * Usada no lugar de foto até o cliente enviar as imagens reais do produto.
 */
export function AcaiCup({ label, scale = 1, className = '' }: AcaiCupProps) {
  return (
    <svg
      viewBox="0 0 200 240"
      role="img"
      aria-label={`Pote de açaí ${label}`}
      className={className}
      style={{ transform: `scale(${scale})` }}
    >
      <defs>
        <linearGradient id={`body-${label}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6d4296" />
          <stop offset="55%" stopColor="#422260" />
          <stop offset="100%" stopColor="#1a0b29" />
        </linearGradient>
        <linearGradient id={`lid-${label}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#b193cf" />
          <stop offset="100%" stopColor="#562f7b" />
        </linearGradient>
      </defs>

      <ellipse cx="100" cy="228" rx="62" ry="9" fill="#1a0b29" opacity="0.18" />

      <path d="M42 58h116l-14 152a14 14 0 0 1-14 12.6H70a14 14 0 0 1-14-12.6L42 58Z" fill={`url(#body-${label})`} />
      <path d="M52 58h20l-10 164h-2a10 10 0 0 1-8-8L52 58Z" fill="#ffffff" opacity="0.1" />

      <rect x="36" y="42" width="128" height="26" rx="13" fill={`url(#lid-${label})`} />
      <ellipse cx="100" cy="42" rx="64" ry="12" fill="#d2c2e3" />
      <ellipse cx="100" cy="42" rx="48" ry="8" fill="#f6f3f9" opacity="0.55" />

      <g fill="#ffffff">
        <text x="100" y="132" textAnchor="middle" fontSize="30" fontWeight="700" letterSpacing="4">
          MR
        </text>
        <text x="100" y="158" textAnchor="middle" fontSize="13" fontWeight="500" opacity="0.75" letterSpacing="2">
          AÇAITERIA
        </text>
      </g>

      <rect x="62" y="176" width="76" height="24" rx="12" fill="#ffffff" opacity="0.92" />
      <text x="100" y="193" textAnchor="middle" fontSize="13" fontWeight="700" fill="#2c1642">
        {label}
      </text>
    </svg>
  )
}
