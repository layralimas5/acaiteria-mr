import { useState } from 'react'
import type { Customer, PaymentMethod } from '../orders/types'
import { paymentLabels } from '../orders/types'

interface CheckoutFormProps {
  readonly onSubmit: (customer: Customer) => void
  readonly onCancel: () => void
}

const payments: readonly PaymentMethod[] = ['pix', 'dinheiro', 'cartao']

const emptyCustomer: Customer = {
  name: '',
  phone: '',
  address: '',
  reference: '',
  payment: 'pix',
  changeFor: '',
  notes: '',
}

/** Dados que a loja precisa para entregar e dar baixa no pedido. */
export function CheckoutForm({ onSubmit, onCancel }: CheckoutFormProps) {
  const [customer, setCustomer] = useState<Customer>(emptyCustomer)
  const [touched, setTouched] = useState(false)

  const missing = {
    name: customer.name.trim().length < 2,
    phone: customer.phone.replace(/\D/g, '').length < 10,
    address: customer.address.trim().length < 6,
  }
  const invalid = missing.name || missing.phone || missing.address

  const update = <K extends keyof Customer>(key: K, value: Customer[K]) =>
    setCustomer((current) => ({ ...current, [key]: value }))

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        setTouched(true)
        if (invalid) return
        onSubmit(customer)
      }}
    >
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

      <Field label="Endereço" error={touched && missing.address ? 'Rua, número e bairro' : null}>
        <input
          type="text"
          value={customer.address}
          onChange={(event) => update('address', event.target.value)}
          placeholder="Rua, número, bairro"
          autoComplete="street-address"
          className="w-full rounded-xl border border-acai-200 px-3 py-2.5 text-sm text-ink outline-none focus:border-acai-700"
        />
      </Field>

      <Field label="Ponto de referência (opcional)" error={null}>
        <input
          type="text"
          value={customer.reference}
          onChange={(event) => update('reference', event.target.value)}
          className="w-full rounded-xl border border-acai-200 px-3 py-2.5 text-sm text-ink outline-none focus:border-acai-700"
        />
      </Field>

      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-[0.14em] text-acai-700">Pagamento</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {payments.map((method) => {
            const active = customer.payment === method
            return (
              <button
                key={method}
                type="button"
                onClick={() => update('payment', method)}
                aria-pressed={active}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-acai-800 text-white'
                    : 'border border-acai-200 text-muted hover:border-acai-400 hover:text-acai-800'
                }`}
              >
                {paymentLabels[method]}
              </button>
            )
          })}
        </div>
      </fieldset>

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

      <Field label="Observações (opcional)" error={null}>
        <textarea
          value={customer.notes}
          onChange={(event) => update('notes', event.target.value)}
          rows={2}
          placeholder="Sem granola, capricha na calda..."
          className="w-full resize-none rounded-xl border border-acai-200 px-3 py-2.5 text-sm text-ink outline-none focus:border-acai-700"
        />
      </Field>

      <div className="flex flex-col gap-2 pt-1 sm:flex-row-reverse">
        <button
          type="submit"
          className="flex-1 rounded-full bg-acai-800 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:animate-pulse-soft hover:bg-acai-900"
        >
          Enviar pedido
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

interface FieldProps {
  readonly label: string
  readonly error: string | null
  readonly children: React.ReactNode
}

function Field({ label, error, children }: FieldProps) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-acai-700">{label}</span>
      <span className="mt-1.5 block">{children}</span>
      {error && <span className="mt-1 block text-xs font-semibold text-amber-700">{error}</span>}
    </label>
  )
}
