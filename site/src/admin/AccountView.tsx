import { business } from '../config/business'

/**
 * Dados da loja que aparecem no site. São lidos de `config/business.ts`, o
 * ponto único de configuração — por isso a tela é de consulta, não de edição.
 */

const formatPhone = (digits: string): string => {
  const local = digits.replace(/^55/, '')
  if (local.length < 10) return digits
  const ddd = local.slice(0, 2)
  const rest = local.slice(2)
  const half = rest.length - 4
  return `(${ddd}) ${rest.slice(0, half)}-${rest.slice(half)}`
}

export function AccountView() {
  const { address } = business
  const city = [address.district, address.city, address.state].filter(Boolean).join(', ')

  return (
    <>
      <h1 className="text-xl font-extrabold text-ink">Minha conta</h1>
      <p className="mt-1 text-sm text-muted">Os dados da loja que aparecem no site.</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="rounded-card border border-acai-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-acai-800 text-sm font-extrabold text-white">
              {business.shortName}
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold text-ink">{business.name}</p>
              <p className="text-xs text-muted">Administradora da loja</p>
            </div>
          </div>

          <dl className="mt-5 space-y-3 border-t border-acai-100 pt-4 text-sm">
            <Row label="WhatsApp" value={formatPhone(business.whatsappNumber)} />
            <Row label="Instagram" value={`@${business.instagramHandle}`} />
            <Row label="Cidade" value={city || '—'} />
            <Row label="Site" value={business.siteUrl} />
            <Row
              label="Atendimento"
              value={business.deliveryOnly ? 'Só delivery' : 'Delivery e balcão'}
            />
          </dl>
        </section>

        <section className="rounded-card border border-acai-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-extrabold text-ink">Horários</h2>
          <dl className="mt-4 space-y-3 text-sm">
            {business.hours.map((hour) => (
              <Row
                key={hour.label}
                label={hour.label}
                value={`${hour.opensAt} às ${hour.closesAt}`}
              />
            ))}
          </dl>

          <h2 className="mt-6 border-t border-acai-100 pt-4 text-sm font-extrabold text-ink">
            Entrega
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Tempo médio" value={`${business.delivery.averageMinutes} minutos`} />
            <Row
              label="Frete grátis"
              value={
                business.delivery.freeShippingFrom === null
                  ? 'Não'
                  : `Acima de R$ ${business.delivery.freeShippingFrom}`
              }
            />
          </dl>

          <p className="mt-6 rounded-2xl bg-acai-50 p-4 text-xs leading-relaxed text-muted">
            Para mudar qualquer um desses dados, é preciso editar o arquivo de configuração da
            loja e publicar o site de novo. Fale com quem cuida do desenvolvimento.
          </p>
        </section>
      </div>
    </>
  )
}

function Row({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-bold text-ink">{value}</dd>
    </div>
  )
}
