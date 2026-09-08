import { useState } from 'react'
import type { ReactNode } from 'react'
import { business, type DeliveryArea } from '../config/business'
import {
  deliveryAreas,
  deliveryFee,
  deliveryPlaceLabel,
  detectDeliveryArea,
  findDeliveryArea,
  formatPrice,
  hasDistrictFees,
  hasPickup,
  missingForFreeShipping,
  pickupAddress,
  placeText,
} from '../lib/order'
import type { DeliveryPlace } from '../lib/order'
import type { Customer, Fulfillment, PaymentMethod } from '../orders/types'
import { paymentHints, paymentLabels } from '../orders/types'
import { CreditCardInfo } from './CreditCardInfo'
import { PixCode } from './PixCode'

interface CheckoutFormProps {
  /** Soma dos itens, sem entrega. A taxa é calculada a partir dela. */
  readonly subtotal: number
  /**
   * Município reconhecido no que o cliente digitou, ou null enquanto ele não
   * disser onde mora. Sobe para o painel para a conta bater nas duas telas.
   */
  readonly area: DeliveryArea | null
  readonly onAreaChange: (area: DeliveryArea | null) => void
  /**
   * Bairro e município como o cliente escreveu. Sobem porque em Viana o bairro
   * muda a taxa: os mais distantes custam mais que o resto da cidade, e o
   * painel precisa da mesma conta.
   */
  readonly onPlaceChange: (place: DeliveryPlace) => void
  /** Entrega ou retirada. Sobe para o painel porque muda a taxa e o total. */
  readonly fulfillment: Fulfillment
  readonly onFulfillmentChange: (fulfillment: Fulfillment) => void
  /** Dados de quem já pediu deste navegador, para não redigitar tudo. */
  readonly initialCustomer?: Customer | null
  readonly onSubmit: (customer: Customer) => void
  /** true enquanto o pedido está sendo gravado, para não enviar duas vezes. */
  readonly sending?: boolean
  /** Erro da gravação, mostrado junto do botão em vez de sumir em silêncio. */
  readonly error?: string | null
  readonly onCancel: () => void
}

/**
 * Formas aceitas hoje, conforme a configuração da loja. A ordem é a da tela:
 * pagar na hora vem primeiro porque é o que fecha o pedido sem depender de
 * ninguém digitar chave nem separar troco.
 */
const availablePayments = (): readonly PaymentMethod[] =>
  (['online', 'pix', 'cartao', 'dinheiro'] as const).filter(
    (method) =>
      method === 'pix' ||
      (method === 'online' && business.payments.onlineCheckout) ||
      (method === 'cartao' && business.payments.cardOnDelivery) ||
      (method === 'dinheiro' && business.payments.cash),
  )

/** Primeira forma da lista: é a que já vem marcada. */
const defaultPayment = (): PaymentMethod => availablePayments()[0] ?? 'pix'

const emptyCustomer = (): Customer => ({
  name: '',
  fulfillment: 'entrega',
  phone: '',
  address: '',
  district: '',
  city: '',
  reference: '',
  payment: defaultPayment(),
  changeFor: '',
  notes: '',
})

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

function OnlineIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current stroke-[1.8]">
      <rect x="5" y="2.5" width="14" height="19" rx="3" />
      <path d="M10 18.5h4" strokeLinecap="round" />
      <path d="M9.5 9.5l1.8 1.8L15 7.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MotoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current stroke-[1.8]">
      <circle cx="5.5" cy="17" r="3" />
      <circle cx="18.5" cy="17" r="3" />
      <path d="M8.5 17h7l-3-6h-3m3 0 1.5-3h2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current stroke-[1.8]">
      <path d="M3.5 9.5h17V20a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z" strokeLinejoin="round" />
      <path d="M4.5 3.5h15l1.5 4.5a3 3 0 0 1-5.5 1.6 3 3 0 0 1-5 0 3 3 0 0 1-5.5-1.6z" strokeLinejoin="round" />
      <path d="M9.5 21v-5h5v5" strokeLinejoin="round" />
    </svg>
  )
}

const paymentIcons: Readonly<Record<PaymentMethod, () => ReactNode>> = {
  online: OnlineIcon,
  pix: PixIcon,
  cartao: CardIcon,
  dinheiro: CashIcon,
}

/** Dados que a loja precisa para entregar e dar baixa no pedido. */
export function CheckoutForm({
  subtotal,
  area,
  onAreaChange,
  onPlaceChange,
  fulfillment,
  onFulfillmentChange,
  initialCustomer = null,
  onSubmit,
  onCancel,
  sending = false,
  error = null,
}: CheckoutFormProps) {
  // A observação é do pedido de hoje: entrega e pagamento voltam, o recado não.
  const [customer, setCustomer] = useState<Customer>(() => {
    if (!initialCustomer) return emptyCustomer()
    // A forma de pagamento do pedido passado pode ter saído do ar desde então
    // (a loja desligou o checkout online, por exemplo). Nesse caso ela volta
    // para o padrão em vez de ficar marcada uma opção que não existe mais.
    const known = availablePayments().includes(initialCustomer.payment)
    return {
      ...initialCustomer,
      payment: known ? initialCustomer.payment : defaultPayment(),
      notes: '',
    }
  })
  const [touched, setTouched] = useState(false)

  const areas = deliveryAreas()
  const pickup = fulfillment === 'retirada'
  const pickupPlace = pickupAddress()
  // Sem município reconhecido não existe taxa: ela só entra na conta quando o
  // cliente diz onde mora, e é isso que segura o envio do pedido. Quem busca na
  // loja não paga entrega nenhuma.
  const typedDistrict = customer.district?.trim() ?? ''
  // Onde o cliente mora, do jeito que ele escreveu. O bairro pode vir tanto no
  // campo de bairro quanto no de município ("Campo Grande"), e os dois valem
  // para achar a taxa.
  const typedPlace = placeText({ district: typedDistrict, city: customer.city ?? '' })
  const fee = !pickup && area ? deliveryFee(subtotal, area, typedPlace) : 0
  // Município com bairro mais caro e bairro ainda em branco: a taxa mostrada é
  // um piso, não o valor final.
  const feeIsEstimate = area !== null && typedDistrict === '' && hasDistrictFees(area)
  const missingForFree = missingForFreeShipping(subtotal)
  const total = subtotal + fee
  const payments = availablePayments()

  const typedCity = customer.city?.trim() ?? ''
  const cityIsUnserved = typedCity.length >= 3 && area === null

  // Na retirada não existe endereço para conferir: o cliente vem até a loja.
  const missing = {
    name: customer.name.trim().length < 2,
    phone: customer.phone.replace(/\D/g, '').length < 10,
    address: !pickup && customer.address.trim().length < 6,
    district: !pickup && (customer.district?.trim() ?? '').length < 2,
    city: !pickup && area === null,
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
    onPlaceChange({ district: customer.district ?? '', city: typed })
  }

  /** O bairro entra na conta da taxa, então o painel também precisa dele. */
  const updateDistrict = (typed: string) => {
    update('district', typed)
    onPlaceChange({ district: typed, city: customer.city ?? '' })
  }

  return (
    <form
      className="space-y-6 sm:space-y-7"
      onSubmit={(event) => {
        event.preventDefault()
        setTouched(true)
        if (invalid || sending) return
        onSubmit(
          pickup
            ? {
                ...customer,
                fulfillment: 'retirada',
                address: '',
                district: '',
                city: '',
                reference: '',
              }
            : { ...customer, fulfillment: 'entrega', city: area?.city ?? '' },
        )
      }}
    >
      <Block title="Seus dados">
        <Field label="Nome" error={touched && missing.name ? 'Diga como te chamar' : null}>
          <input
            type="text"
            value={customer.name}
            maxLength={80}
            onChange={(event) => update('name', event.target.value)}
            autoComplete="name"
            className="w-full rounded-xl border border-acai-200 px-3.5 py-3 text-base text-ink outline-none focus:border-acai-700 sm:px-3 sm:py-2.5 sm:text-sm"
          />
        </Field>

        <Field label="WhatsApp" error={touched && missing.phone ? 'Telefone com DDD' : null}>
          <input
            type="tel"
            inputMode="tel"
            value={customer.phone}
            maxLength={20}
            onChange={(event) => update('phone', event.target.value)}
            placeholder="(27) 90000-0000"
            autoComplete="tel"
            className="w-full rounded-xl border border-acai-200 px-3.5 py-3 text-base text-ink outline-none focus:border-acai-700 sm:px-3 sm:py-2.5 sm:text-sm"
          />
        </Field>
      </Block>

      <Block title={pickup ? 'Retirada' : 'Entrega'}>
        {hasPickup() && (
          <fieldset>
            <legend className="sr-only">Como quer receber</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(['entrega', 'retirada'] as const).map((option) => {
                const active = fulfillment === option
                const Icon = option === 'entrega' ? MotoIcon : StoreIcon

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onFulfillmentChange(option)}
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
                      <span className="block text-sm font-bold">
                        {option === 'entrega' ? 'Receber em casa' : 'Retirar no local'}
                      </span>
                      <span className={`block text-xs ${active ? 'text-acai-100/80' : 'text-muted'}`}>
                        {option === 'entrega'
                          ? 'A gente leva até você'
                          : 'Você busca e não paga entrega'}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}

        {pickup ? (
          <div className="rounded-2xl border border-acai-100 bg-acai-50/70 px-4 py-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-ink">Retirada no local</span>
              <span className="font-extrabold text-green-700">Sem taxa</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {pickupPlace === ''
                ? business.pickup.note
                : `Retire em ${pickupPlace}. Fica pronto a partir de ${business.pickup.minMinutes} minutos depois da confirmação.`}
            </p>
          </div>
        ) : (
          <>
            <Field label="Endereço" error={touched && missing.address ? 'Rua e número' : null}>
              <input
                type="text"
                value={customer.address}
                maxLength={160}
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
                className="w-full rounded-xl border border-acai-200 px-3.5 py-3 text-base text-ink outline-none focus:border-acai-700 sm:px-3 sm:py-2.5 sm:text-sm"
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Bairro" error={touched && missing.district ? 'Diga o bairro' : null}>
                <input
                  type="text"
                  value={customer.district ?? ''}
                  maxLength={80}
                  onChange={(event) => updateDistrict(event.target.value)}
                  placeholder="Campo Grande"
                  autoComplete="address-level3"
                  className="w-full rounded-xl border border-acai-200 px-3.5 py-3 text-base text-ink outline-none focus:border-acai-700 sm:px-3 sm:py-2.5 sm:text-sm"
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
                  maxLength={80}
                  onChange={(event) => updateCity(event.target.value)}
                  placeholder="Viana"
                  list="municipios-atendidos"
                  autoComplete="address-level2"
                  className="w-full rounded-xl border border-acai-200 px-3.5 py-3 text-base text-ink outline-none focus:border-acai-700 sm:px-3 sm:py-2.5 sm:text-sm"
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
                  <span className="font-semibold text-ink">
                    Taxa de entrega para {deliveryPlaceLabel(area, typedPlace)}
                  </span>
                  <span className={`font-extrabold ${fee === 0 ? 'text-green-700' : 'text-acai-800'}`}>
                    {fee === 0
                      ? 'Grátis'
                      : feeIsEstimate
                        ? `a partir de ${formatPrice(fee)}`
                        : formatPrice(fee)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {feeIsEstimate
                    ? 'Escreva o bairro: os mais distantes têm taxa própria.'
                    : `Chega a partir de ${business.delivery.minMinutes} minutos depois da confirmação.`}
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
                maxLength={160}
                onChange={(event) => update('reference', event.target.value)}
                placeholder="Portão azul, ao lado da padaria..."
                className="w-full rounded-xl border border-acai-200 px-3.5 py-3 text-base text-ink outline-none focus:border-acai-700 sm:px-3 sm:py-2.5 sm:text-sm"
              />
            </Field>
          </>
        )}
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

        {customer.payment === 'online' && <CreditCardInfo total={total} pickup={pickup} />}

        {/*
          O código sai aqui, no clique, e não só depois de enviar: quem escolhe
          Pix quer pagar naquele instante, com o celular na mão. O valor é o
          desta tela, taxa de entrega incluída, e o card avisa que pagar sozinho
          não envia o pedido.
        */}
        {customer.payment === 'pix' && <PixCode amount={total} beforeOrder />}

        {customer.payment === 'dinheiro' && (
          <Field label="Troco para quanto? (opcional)" error={null}>
            <input
              type="text"
              inputMode="decimal"
              value={customer.changeFor}
              maxLength={20}
              onChange={(event) => update('changeFor', event.target.value)}
              placeholder="R$ 50,00"
              className="w-full rounded-xl border border-acai-200 px-3.5 py-3 text-base text-ink outline-none focus:border-acai-700 sm:px-3 sm:py-2.5 sm:text-sm"
            />
          </Field>
        )}
      </Block>

      <Block title="Observações">
        <Field label="Algo pra cozinha? (opcional)" error={null}>
          <textarea
            value={customer.notes}
            maxLength={500}
            onChange={(event) => update('notes', event.target.value)}
            rows={2}
            placeholder="Sem granola, capricha na calda..."
            className="w-full resize-none rounded-xl border border-acai-200 px-3.5 py-3 text-base text-ink outline-none focus:border-acai-700 sm:px-3 sm:py-2.5 sm:text-sm"
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
            <dt className="text-muted">
              {pickup ? 'Retirada no local' : `Entrega${area ? ` · ${area.city}` : ''}`}
            </dt>
            <dd className={`font-semibold ${pickup || (area && fee === 0) ? 'text-green-700' : 'text-ink'}`}>
              {pickup ? 'Sem taxa' : area ? (fee === 0 ? 'Grátis' : formatPrice(fee)) : 'a calcular'}
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

      <div className="flex flex-col gap-2.5 sm:flex-row-reverse">
        <button
          type="submit"
          disabled={sending}
          className="flex-1 rounded-full bg-acai-800 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:animate-pulse-soft hover:bg-acai-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending
            ? 'Enviando...'
            : customer.payment === 'online'
              ? pickup || area
                ? `Ir para o pagamento · ${formatPrice(total)}`
                : 'Ir para o pagamento'
              : pickup || area
                ? `Enviar pedido · ${formatPrice(total)}`
                : 'Enviar pedido'}
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
    <section className="space-y-2.5 sm:space-y-3">
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
      <span className="text-[0.8125rem] font-semibold text-muted sm:text-xs">{label}</span>
      <span className="mt-1.5 block">{children}</span>
      {error && <span className="mt-1 block text-xs font-semibold text-amber-700">{error}</span>}
    </label>
  )
}
