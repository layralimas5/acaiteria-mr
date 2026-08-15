import { statusMessage } from '../orders/messages'
import type { Order, OrderStatus } from '../orders/types'
import { statusLabels } from '../orders/types'

/** Preferências do painel. Ficam salvas no navegador da loja. */

interface SettingsViewProps {
  readonly autoNotify: boolean
  readonly onAutoNotifyChange: (value: boolean) => void
}

/** Pedido fictício só para mostrar como o aviso chega ao cliente. */
const sample = {
  id: 'exemplo',
  code: '1207',
  createdAt: '',
  updatedAt: '',
  status: 'novo',
  customer: {
    name: 'Ana',
    phone: '',
    address: '',
    reference: '',
    payment: 'pix',
    changeFor: '',
    notes: '',
  },
  items: [],
  total: 0,
} satisfies Order

const previewed: readonly OrderStatus[] = ['preparando', 'entrega', 'concluido']

export function SettingsView({ autoNotify, onAutoNotifyChange }: SettingsViewProps) {
  return (
    <>
      <h1 className="text-xl font-extrabold text-ink">Configurações</h1>
      <p className="mt-1 text-sm text-muted">Preferências salvas neste navegador.</p>

      <section className="mt-5 max-w-2xl rounded-card border border-acai-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-ink">Aviso ao cliente</h2>

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl bg-acai-50 p-4">
          <input
            type="checkbox"
            checked={autoNotify}
            onChange={(event) => onAutoNotifyChange(event.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-acai-800"
          />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-ink">
              Avisar o cliente ao dar baixa no pedido
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-muted">
              A cada mudança de etapa, o WhatsApp do cliente abre em uma aba nova com a mensagem
              já escrita. Basta enviar.
            </span>
          </span>
        </label>

        <div className="mt-5 border-t border-acai-100 pt-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
            Mensagens enviadas
          </p>
          <ul className="mt-3 space-y-3">
            {previewed.map((status) => (
              <li key={status}>
                <p className="text-xs font-bold text-acai-700">{statusLabels[status]}</p>
                <p className="mt-1 rounded-2xl rounded-tl-sm bg-acai-50 px-4 py-3 text-sm leading-relaxed text-ink">
                  {statusMessage(sample, status)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
