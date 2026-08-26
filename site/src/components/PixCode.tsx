import { useMemo, useRef, useState } from 'react'
import qrcode from 'qrcode-generator'
import { business } from '../config/business'
import { formatPrice } from '../lib/order'
import { storePixCode } from '../lib/pix'

interface PixCodeProps {
  /** Valor a cobrar, em reais. Já entra fechado no código. */
  readonly amount: number
  /** Referência no extrato da loja, normalmente o número do pedido. */
  readonly reference: string
}

/** Os quadradinhos escuros do QR, como um caminho SVG só. */
const qrPath = (payload: string): { readonly d: string; readonly size: number } => {
  const qr = qrcode(0, 'M')
  qr.addData(payload)
  qr.make()

  const size = qr.getModuleCount()
  let d = ''

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (qr.isDark(row, col)) d += `M${col} ${row}h1v1h-1z`
    }
  }

  return { d, size }
}

/**
 * Pix copia e cola do pedido: o valor já vem fechado, então o cliente não
 * digita chave nem erra centavo, e a loja confere o comprovante pelo número
 * do pedido que aparece no extrato.
 *
 * O QR serve para quem está no computador e paga pelo celular. No celular o
 * que resolve é o botão de copiar, por isso ele vem primeiro na leitura.
 */
export function PixCode({ amount, reference }: PixCodeProps) {
  const payload = useMemo(() => storePixCode(amount, reference), [amount, reference])
  const qr = useMemo(() => (payload ? qrPath(payload) : null), [payload])
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const codeRef = useRef<HTMLTextAreaElement>(null)

  if (!payload || !qr) return null

  const copy = () => {
    const done = () => {
      setCopied(true)
      setCopyFailed(false)
      window.setTimeout(() => setCopied(false), 2500)
    }

    // Sem clipboard (navegador antigo ou permissão negada) o código não some
    // da tela: ele fica selecionado, pronto para o copiar do próprio aparelho.
    const fallback = () => {
      const node = codeRef.current
      if (!node) {
        setCopyFailed(true)
        return
      }

      node.focus()
      node.select()
      setCopyFailed(true)
    }

    if (!navigator.clipboard) {
      fallback()
      return
    }

    navigator.clipboard.writeText(payload).then(done, fallback)
  }

  return (
    <div className="w-full rounded-2xl border border-acai-100 bg-acai-50/70 p-4 text-left">
      <p className="text-sm font-bold text-ink">
        Pague {formatPrice(amount)} no Pix
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        O valor já vai certo no código. Copie, abra o app do banco em Pix copia e cola e confirme.
      </p>

      <button
        type="button"
        onClick={copy}
        className="mt-3 w-full rounded-full bg-acai-800 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-acai-900"
      >
        {copied ? 'Código copiado!' : 'Copiar código Pix'}
      </button>

      <p aria-live="polite" className="sr-only">
        {copied ? 'Código Pix copiado para a área de transferência.' : ''}
      </p>

      {copyFailed && (
        <p className="mt-2 text-xs font-semibold text-acai-800">
          Não deu para copiar sozinho. O código está selecionado aqui embaixo.
        </p>
      )}

      <label className="mt-3 block">
        <span className="sr-only">Código Pix copia e cola</span>
        <textarea
          ref={codeRef}
          readOnly
          value={payload}
          rows={2}
          onFocus={(event) => event.target.select()}
          className="w-full resize-none rounded-xl border border-acai-200 bg-white px-3 py-2 font-mono text-[11px] leading-snug text-muted outline-none focus:border-acai-700"
        />
      </label>

      <div className="mt-3 hidden items-center gap-3 sm:flex">
        <svg
          viewBox={`-2 -2 ${qr.size + 4} ${qr.size + 4}`}
          role="img"
          aria-label={`QR Code do Pix de ${formatPrice(amount)}`}
          className="size-28 shrink-0 rounded-lg bg-white p-1"
        >
          <path d={qr.d} fill="currentColor" className="text-ink" />
        </svg>
        <p className="text-xs leading-relaxed text-muted">
          Pagando pelo celular? Aponte a câmera do app do banco para o QR.
        </p>
      </div>

      <p className="mt-3 text-xs text-muted">
        Recebedor: <strong className="font-semibold text-ink">{business.payments.pixHolder}</strong>
        {' · '}
        Chave: <strong className="font-semibold text-ink">{business.payments.pixKey}</strong>
      </p>
      <p className="mt-1 text-xs text-muted">
        Depois de pagar, mande o comprovante na conversa do WhatsApp.
      </p>
    </div>
  )
}
