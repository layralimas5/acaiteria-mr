import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface StepPanelProps {
  readonly title: string
  readonly subtitle: string
  readonly done: boolean
  readonly children: ReactNode
  readonly footer?: ReactNode
}

/** Conteúdo de uma etapa. Só uma aparece por vez. */
export function StepPanel({ title, subtitle, done, children, footer }: StepPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      <header className="flex items-start gap-3">
        <div className="min-w-0">
          <h3 className="text-xl font-extrabold leading-tight tracking-tight text-ink sm:text-2xl">
            {title}
          </h3>
          <p className={`mt-1 text-sm ${done ? 'font-semibold text-green-700' : 'text-muted'}`}>{subtitle}</p>
        </div>
      </header>

      <div className="mt-5">{children}</div>

      {footer && <div className="mt-7 border-t border-acai-100 pt-5">{footer}</div>}
    </motion.div>
  )
}
