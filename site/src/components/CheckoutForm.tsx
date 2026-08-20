import { useState } from 'react'
import type { ReactNode } from 'react'
import { business, type DeliveryArea } from '../config/business'
import {
  deliveryAreas,
  deliveryFee,
  detectDeliveryArea,
  findDeliveryArea,
  formatPrice,
  missingForFreeShipping,
} from '../lib/order'
import type { Customer, PaymentMethod } from '../orders/types'
import { paymentHints, paymentLabels } from '../orders/types'

interface CheckoutFormProps {
  /** Soma dos itens, sem entrega. A taxa é calculada a partir dela. */
  readonly subtotal: number
  /**
   * Município reconhecido no que o cliente digitou, ou null enquanto ele não
   * disser onde mora. Sobe para o painel para a conta bater nas duas telas.
   */
  readonly area: DeliveryArea | null
  readonly onAreaChange: (area: DeliveryArea | null) => void
  /** Dados de quem já pediu deste navegador, para não redigitar tudo. */
  readonly initialCustomer?: Customer | null
  readonly onSubmit: (customer: Customer) => void
  /** true enquanto o pedido está sendo gravado, para não enviar duas vezes. */
  readonly sending?: boolean
  /** Erro da gravação, mostrado junto do botão em vez de sumir em silêncio. */
  readonly error?: string | null
  readonly onCancel: () => void
}

/** Formas aceitas hoje, conforme a configuração da loja. */
const availablePayments = (): readonly PaymentMethod[] =>
  (['pix', 'cartao', 'dinheiro'] as const).filter(
    (method) =>
      method === 'pix' ||
      (method === 'cartao' && business.payments.cardOnDelivery) ||
      (method === 'dinheiro' && business.payments.cash),
  )

const emptyCustomer: Customer = {
  name: '',
  phone: '',
  address: '',
  district: '',
  city: '',
  reference: '',
  payment: 'pix',
  changeFor: '',
  notes: '',
}

function PixIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current stroke-[1.8]">
      <path d="M12 3.6 20.4 12 12 20.4 3.6 12z" strokeLinejoin="round" />
    </svg>
  )
}

function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current stroke-[1.8]">
      <rect x="2.5" y="5" width="19" height="14" rx="3" />
      <path d="M2.5 10h19" strokeLinecap="round" />
    </svg>
  )
}

function CashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current stroke-[1.8]">
      <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  )
}

const paymentIcons: Readonly<Record<PaymentMethod, () => ReactNode>> = {
  pix: PixIcon,
  cartao: CardIcon,
  dinheiro: CashIcon,
}

/** Dados que a loja precisa para entregar e dar baixa no pedido. */
export function CheckoutForm({
  subtotal,
  area,
  onAreaChange,
  initialCustomer = null,
  onSubmit,
  onCancel,
  sending = false,
  error = null,
}: CheckoutFormProps) {
  // A observação é do pedido de hoje: entrega e pagamento voltam, o recado não.
  const [customer, setCustomer] = useState<Customer>(
    initialCustomer ? { ...initialCustomer, notes: '' } : emptyCustomer,
  )
  const [touched, setTouched] = useState(false)

  const areas = deliveryAreas()
  // Sem município reconhecido não existe taxa: ela só entra na conta quando o
  // cliente diz onde mora, e é isso que segura o envio do pedido.
  const fee = area ? deliveryFee(subtotal, area) : 0
  const missingForFree = missingForFreeShipping(subtotal)
  const total = subtotal + fee
  const payments = availablePayments()

  const typedCity = customer.city?.trim() ?? ''
  const cityIsUnserved = typedCity.length >= 3 && area === null

  const missing = {
    name: customer.name.trim().length < 2,
    phone: customer.phone.replace(/\D/g, '').length < 10,
    address: customer.address.trim().length < 6,
    district: (customer.district?.trim() ?? '').length < 2,
    city: area === null,
  }
  const invalid =
    missing.name || missing.phone || missing.address || missing.district || missing.city

  const update = <K extends keyof Customer>(key: K, value: Customer[K]) =>
    setCustomer((current) => ({ ...current, [key]: value }))

  /**
   * O município manda na taxa, então cada tecla aqui refaz a conta. O painel
   * fica sabendo na hora: é ele que guarda o valor levado para o banco.
   */
  const updateCity = (typed: string) => {
    update('city', typed)
    onAreaChange(findDeliveryArea(typed))
  }

  return (
    <form
      className="space-y-7"
      onSubmit={(event) => {
        event.preventDefault()
        setTouched(true)
        if (invalid || sending) return
        onSubmit({ ...customer, city: area?.city ?? '' })
      }}
    >
      <Block title="Seus dados">
        <Field label="Nome" error={touched && missing.name ? 'Diga como te chamar' : null}>
          <input
            type="text"
            value={customer.name}
            onChange={(event) => update('name', event.target.value)}
            autoComplete="name"
            className="w-full rounded-xl border border-acai-200 px-3 py-2.5 text-sm text-ink outline-none focus:border-acai-700"
          />
        </Field>

        <Field label="WhatsApp" error={touched && missing.phone ? 'Telefone com DDD' : null}>
          <input
            type="tel"
            inputMode="tel"
            value={customer.phone}
            onChange={(event) => update('phone', event.target.value)}
            placeholder="(27) 90000-0000"
            autoComplete="tel"
            className="w-full rounded-xl border border-acai-200 px-3 py-2.5 text-sm text-ink outline-none focus:border-acai-700"
          />
        </Field>
      </Block>

      <Block title="Entrega">
        <Field label="Endereço" error={touched && missing.address ? 'Rua e número' : null}>
          <input
            type="text"
            value={customer.address}
            onChange={(event) => {
              const typed = event.target.value
              update('address', typed)

              // Quem cola o endereço inteiro numa linha só ("Rua tal, 100,
              // Campo Grande, Cariacica") não precisa repetir a cidade: ela
              // preenche o campo de baixo sozinha, se ele ainda estiver vazio.
              if (typedCity !== '') return
              const detected = detectDeliveryArea(typed)
              if (detected) updateCity(detected.city)
            }}
            placeholder="Rua, número"
            autoComplete="street-address"
            className="w-full rounded-xl border border-acai-200 px-3 py-2.5 text-sm text-ink outline-none focus:border-acai-700"
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Bairro" error={touched && missing.district ? 'Diga o bairro' : null}>
            <input
              type="text"
              value={customer.district ?? ''}
              onChange={(event) => update('district', event.target.value)}
              placeholder="Campo Grande"
              autoComplete="address-level3"
              className="w-full rounded-xl border border-acai-200 px-3 py-2.5 text-sm text-ink outline-none focus:border-acai-700"
            />
          </Field>

          <Field
            label="Município"
            error={
              touched && missing.city
                ? cityIsUnserved
                  ? 'Ainda não entregamos aí'
                  : 'Diga o município'
                : null
            }
          >
            <input
              type="text"
              value={customer.city ?? ''}
              onChange={(event) => updateCity(event.target.value)}
              placeholder="Viana"
              list="municipios-atendidos"
              autoComplete="address-level2"
              className="w-full rounded-xl border border-acai-200 px-3 py-2.5 text-sm text-ink outline-none focus:border-acai-700"
            />
            <datalist id="municipios-atendidos">
              {areas.map((option) => (
                <option key={option.city} value={option.city} />
              ))}
            </datalist>
          </Field>
        </div>

        {/*
          A taxa aparece quando o município aparece, e não antes: até o cliente
          dizer onde mora, não existe valor honesto para mostrar.
        */}
        {area ? (
          <div className="rounded-2xl border border-acai-100 bg-acai-50/70 px-4 py-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-ink">Taxa de entrega para {area.city}</span>
              <span className={`font-extrabold ${fee === 0 ? 'text-green-700' : 'text-acai-800'}`}>
                {fee === 0 ? 'Grátis' : formatPrice(fee)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">
              Chega a partir de {business.delivery.minMinutes} minutos depois da confirmação.
            </p>
            {missingForFree > 0 && (
              <p className="mt-2 text-xs font-semibold text-acai-800">
                Faltam {formatPrice(missingForFree)} para a entrega sair de graça.
              </p>
            )}
          </div>
        ) : cityIsUnserved ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-800">
            Ainda não entregamos em {typedCity}. Confere se escreveu certo ou chama a gente no
            WhatsApp para combinar.
          </p>
        ) : (
          <p className="rounded-2xl border border-acai-100 bg-acai-50/70 px-4 py-3 text-xs leading-relaxed text-muted">
            Escreva o município e a taxa de entrega aparece aqui.
          </p>
        )}

        <Field label="Ponto de referência (opcional)" error={null}>
          <input
            type="text"
            value={customer.reference}
            onChange={(event) => update('reference', event.target.value)}
            placeholder="Portão azul, ao lado da padaria..."
            className="w-full rounded-xl border border-acai-200 px-3 py-2.5 text-sm text-ink outline-none focus:border-acai-700"
          />
        </Field>
      </Block>

      <Block title="Pagamento">
        <fieldset>
          <legend className="sr-only">Forma de pagamento</legend>
          <div className="grid gap-2">
            {payments.map((method) => {
              const active = customer.payment === method
              const Icon = paymentIcons[method]

              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => update('payment', method)}
                  aria-pressed={active}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                    active
                      ? 'border-acai-800 bg-acai-800 text-white'
                      : 'border-acai-200 bg-white text-ink hover:border-acai-400'
                  }`}
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                      active ? 'bg-white/15 text-white' : 'bg-acai-50 text-acai-800'
                    }`}
                  >
                    <Icon />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{paymentLabels[method]}</span>
                    <span className={`block text-xs ${active ? 'text-acai-100/80' : 'text-muted'}`}>
                      {paymentHints[method]}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>

        {customer.payment === 'pix' && business.payments.pixKey && (
          <p className="rounded-2xl border border-acai-100 bg-acai-50/70 px-4 py-3 text-xs text-muted">
            Chave Pix: <strong className="font-bold text-ink">{business.payments.pixKey}</strong> (
            {business.payments.pixHolder})
          </p>
        )}

        {customer.payment === 'dinheiro' && (
          <Field label="Troco para quanto? (opcional)" error={null}>
            <input
              type="text"
              inputMode="numeric"
              value={customer.changeFor}
              onChange={(event) => update('changeFor', event.target.value)}
              placeholder="R$ 50,00"
              className="w-full rounded-xl border border-acai-200 px-3 py-2.5 text-sm text-ink outline-none focus:border-acai-700"
            />
          </Field>
        )}
      </Block>

      <Block title="Observações">
        <Field label="Algo pra cozinha? (opcional)" error={null}>
          <textarea
            value={customer.notes}
            onChange={(event) => update('notes', event.target.value)}
            rows={2}
            placeholder="Sem granola, capricha na calda..."
            className="w-full resize-none rounded-xl border border-acai-200 px-3 py-2.5 text-sm text-ink outline-none focus:border-acai-700"
          />
        </Field>
      </Block>

      <div className="rounded-2xl border border-acai-100 bg-white px-4 py-3">
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Itens</dt>
            <dd className="font-semibold text-ink">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Entrega{area ? ` · ${area.city}` : ''}</dt>
            <dd className={`font-semibold ${area && fee === 0 ? 'text-green-700' : 'text-ink'}`}>
              {area ? (fee === 0 ? 'Grátis' : formatPrice(fee)) : 'a calcular'}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-acai-100 pt-2">
            <dt className="font-bold text-ink">Total</dt>
            <dd className="text-xl font-extrabold text-acai-800">{formatPrice(total)}</dd>
          </div>
        </dl>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <button
          type="submit"
          disabled={sending}
          className="flex-1 rounded-full bg-acai-800 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:animate-pulse-soft hover:bg-acai-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? 'Enviando...' : area ? `Enviar pedido · ${formatPrice(total)}` : 'Enviar pedido'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-acai-200 px-6 py-3.5 text-sm font-bold text-acai-800 transition-colors hover:bg-acai-50"
        >
          Voltar
        </button>
      </div>
    </form>
  )
}

function Block({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-acai-700">{title}</h3>
      {children}
    </section>
  )
}

interface FieldProps {
  readonly label: string
  readonly error: string | null
  readonly children: ReactNode
}

function Field({ label, error, children }: FieldProps) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <span className="mt-1.5 block">{children}</span>
      {error && <span className="mt-1 block text-xs font-semibold text-amber-700">{error}</span>}
    </label>
  )
}
