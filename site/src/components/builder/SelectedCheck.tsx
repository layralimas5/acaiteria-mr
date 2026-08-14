import { motion } from 'framer-motion'

interface SelectedCheckProps {
  readonly className?: string
  readonly size?: 'sm' | 'md'
}

/** Selo de escolhido, com uma entrada curta em mola. */
export function SelectedCheck({ className = 'right-3 top-3', size = 'md' }: SelectedCheckProps) {
  const box = size === 'sm' ? 'size-5' : 'size-6'
  const icon = size === 'sm' ? 'size-3' : 'size-3.5'

  return (
    <motion.span
      aria-hidden="true"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 520, damping: 22 }}
      className={`absolute ${className} grid ${box} place-items-center rounded-full bg-acai-800 text-white shadow-md shadow-acai-900/25`}
    >
      <svg viewBox="0 0 20 20" className={`${icon} fill-none stroke-current stroke-[3]`}>
        <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.span>
  )
}
