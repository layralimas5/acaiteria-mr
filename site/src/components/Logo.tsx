import { business } from '../config/business'

interface LogoProps {
  readonly className?: string
  readonly priority?: boolean
}

/** Selo circular da marca. A arte oficial já é redonda, então recorta em círculo. */
export function Logo({ className = 'size-11', priority = false }: LogoProps) {
  return (
    <img
      src="/imagem/logo-oficial.png"
      alt={`Logo da ${business.name}`}
      width={96}
      height={96}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      className={`shrink-0 rounded-full object-cover ring-1 ring-white/15 ${className}`}
    />
  )
}
