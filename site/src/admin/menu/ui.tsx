import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ACCEPTED_IMAGE_TYPES, uploadCatalogImage } from '../../catalog/upload'
import type { ImageFolder } from '../../catalog/upload'
import { errorMessage } from '../../lib/supabase'

/**
 * Peças de formulário do cardápio.
 *
 * O cardápio inteiro é cadastro: campo, preço, salvar, apagar, reordenar. Em
 * vez de repetir a mesma marcação em cada editor, as peças ficam aqui.
 */

interface FieldProps {
  readonly label: string
  readonly value: string
  readonly onChange: (value: string) => void
  readonly placeholder?: string
  readonly hint?: string
  readonly required?: boolean
  readonly maxLength?: number
  readonly className?: string
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  required = false,
  maxLength,
  className = '',
}: FieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-bold text-acai-700">
        {label}
        {!required && <span className="font-semibold text-muted"> (opcional)</span>}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="mt-1 w-full rounded-xl border border-acai-200 px-3 py-2 text-sm text-ink outline-none focus:border-acai-700"
      />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

interface NumberFieldProps {
  readonly label: string
  readonly value: number
  readonly onChange: (value: number) => void
  readonly min?: number
  readonly max?: number
  readonly step?: number
  readonly hint?: string
  readonly className?: string
}

export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 0.5,
  hint,
  className = '',
}: NumberFieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-bold text-acai-700">{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => {
          const parsed = Number(event.target.value)
          onChange(Number.isFinite(parsed) ? parsed : 0)
        }}
        min={min}
        max={max}
        step={step}
        inputMode="decimal"
        className="mt-1 w-full rounded-xl border border-acai-200 px-3 py-2 text-sm text-ink outline-none focus:border-acai-700"
      />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

interface ImageFieldProps {
  readonly label: string
  readonly value: string
  readonly onChange: (value: string) => void
  /** Pasta do bucket, para a foto do produto não se misturar com a do complemento. */
  readonly folder: ImageFolder
  /** Foto que o site usaria sozinho se este campo ficar vazio. */
  readonly fallback?: string | null
  /** O que aparece no quadrado quando não há foto nenhuma. */
  readonly placeholder?: ReactNode
  readonly hint?: string
  readonly className?: string
}

/**
 * Foto de um item do cardápio, escolhida do computador ou do celular.
 *
 * A loja aperta "Enviar foto", escolhe o arquivo e pronto: ele sobe para o
 * Storage e o cadastro guarda a URL. Ninguém precisa publicar arquivo em pasta
 * nem colar caminho, embora colar continue funcionando para as fotos de
 * estúdio que já vivem no site.
 */
export function ImageField({
  label,
  value,
  onChange,
  folder,
  fallback = null,
  placeholder,
  hint,
  className = '',
}: ImageFieldProps) {
  const input = useRef<HTMLInputElement>(null)
  const [sending, setSending] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const chosen = value.trim()
  const preview = chosen || fallback

  const send = (file: File | undefined) => {
    if (!file) return
    setSending(true)
    setFailure(null)

    uploadCatalogImage(file, folder)
      .then((url) => onChange(url))
      .catch((cause: unknown) => setFailure(errorMessage(cause)))
      .finally(() => {
        setSending(false)
        if (input.current) input.current.value = ''
      })
  }

  return (
    <div className={className}>
      <span className="text-xs font-bold text-acai-700">
        {label}
        <span className="font-semibold text-muted"> (opcional)</span>
      </span>

      <div className="mt-1 flex items-center gap-3 rounded-xl border border-acai-200 bg-white p-2">
        <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-acai-50">
          {preview ? (
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-xl" aria-hidden="true">
              {placeholder ?? '🖼️'}
            </span>
          )}
        </span>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <input
            ref={input}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            className="sr-only"
            onChange={(event) => send(event.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={sending}
            className="rounded-full border border-acai-200 px-3.5 py-1.5 text-xs font-bold text-acai-800 transition-colors hover:bg-acai-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? 'Enviando...' : chosen ? 'Trocar foto' : 'Enviar foto'}
          </button>
          {chosen && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-red-700"
            >
              Remover
            </button>
          )}
          <span className="w-full truncate text-[11px] text-muted">
            {chosen ? chosen : (hint ?? 'JPG, PNG ou WebP, até 5 MB')}
          </span>
        </div>
      </div>

      {failure && (
        <p role="alert" className="mt-1 text-xs font-semibold text-red-700">
          {failure}
        </p>
      )}
    </div>
  )
}

interface SwitchProps {
  readonly checked: boolean
  readonly onChange: (checked: boolean) => void
  readonly label: string
}

/** Liga e desliga um item no site sem apagar o cadastro. */
export function AvailableSwitch({ checked, onChange, label }: SwitchProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 shrink-0 accent-acai-800"
      />
      <span className={`text-xs font-bold ${checked ? 'text-acai-800' : 'text-muted'}`}>
        {label}
      </span>
    </label>
  )
}

interface ActionProps {
  readonly onClick: () => void
  readonly label: string
  readonly disabled?: boolean
  readonly children: ReactNode
}

export function IconButton({ onClick, label, disabled = false, children }: ActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid size-8 shrink-0 place-items-center rounded-full border border-acai-100 text-acai-800 transition-colors hover:bg-acai-50 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}

export function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 stroke-current stroke-2 fill-none">
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 stroke-current stroke-2 fill-none">
      <path d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PrimaryButton({
  onClick,
  disabled = false,
  children,
}: {
  readonly onClick: () => void
  readonly disabled?: boolean
  readonly children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-acai-800 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-acai-900 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}

export function GhostButton({
  onClick,
  children,
}: {
  readonly onClick: () => void
  readonly children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-acai-800"
    >
      {children}
    </button>
  )
}

/** Aviso curto de erro, no mesmo lugar em todos os editores. */
export function ErrorNote({ message }: { readonly message: string | null }) {
  if (!message) return null

  return (
    <p role="alert" className="mt-3 rounded-2xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">
      {message}
    </p>
  )
}
