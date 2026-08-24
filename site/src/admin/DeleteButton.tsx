import { useEffect, useState } from 'react'

/**
 * Apagar em dois cliques. Apagar pedido é irreversível e o painel roda em
 * balcão de loja, com o dedo perto da tela: o primeiro clique arma, o segundo
 * confirma, e o botão desarma sozinho depois de alguns segundos.
 */

interface DeleteButtonProps {
  readonly onConfirm: () => void
  /** Texto do estado normal. O estado armado é sempre "Confirmar". */
  readonly label?: string
  /** Versão só de ícone, para a lista compacta. */
  readonly compact?: boolean
}

const ARM_MS = 4000

export function DeleteButton({ onConfirm, label = 'Apagar', compact = false }: DeleteButtonProps) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const id = window.setTimeout(() => setArmed(false), ARM_MS)
    return () => window.clearTimeout(id)
  }, [armed])

  const handleClick = () => {
    if (!armed) {
      setArmed(true)
      return
    }
    setArmed(false)
    onConfirm()
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={armed ? 'Confirmar exclusão do pedido' : 'Apagar pedido'}
        title={armed ? 'Clique de novo para apagar' : 'Apagar pedido'}
        className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition-colors ${
          armed ? 'bg-red-600 text-white' : 'text-muted hover:bg-red-50 hover:text-red-700'
        }`}
      >
        <TrashIcon />
        {armed && 'Confirmar'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
        armed ? 'bg-red-600 text-white' : 'text-muted hover:bg-red-50 hover:text-red-700'
      }`}
    >
      <TrashIcon />
      {armed ? 'Confirmar' : label}
    </button>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-none stroke-current stroke-2">
      <path d="M4 7h16M10 4h4M9 7v12M15 7v12M6 7l1 13h10l1-13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
