import { business } from '../config/business'
import { formatPrice, whatsappDisplay } from '../lib/order'
import type { Order } from './types'
import { isPickup, paymentLabels } from './types'

/**
 * Comprovante de pedido para impressão. Não é documento fiscal: é o cupom que
 * a loja imprime para separar o pedido e mandar junto com a entrega.
 *
 * A loja imprime numa térmica portátil Bluetooth (Altomex/LTOMEX AL-3179):
 * bobina de 58mm, área útil de 48mm, 203dpi. Todo o layout é medido pelas
 * constantes abaixo, então trocar de impressora é trocar esses números.
 */

/** Largura física da bobina. */
const paperWidthMm = 58

/**
 * Faixa que a cabeça térmica realmente marca. O resto da bobina é margem morta:
 * o que passar disso é cortado no papel, não redimensionado.
 */
const printWidthMm = 48

/**
 * Avanço no fim do cupom. Na portátil a serrilha fica alguns milímetros acima
 * da cabeça de impressão: sem essa sobra, o rodapé morre dentro do mecanismo e
 * só aparece no começo do cupom seguinte.
 */
const feedMm = 12

/**
 * Logo impressa no topo do cupom. É uma versão preto e branco da marca
 * (`logo-print.png`), não a oficial: o fundo roxo da arte original viraria um
 * bloco preto na bobina térmica.
 */
const logoPath = '/imagem/logo-print.png'

/** A impressão roda num iframe `about:blank`, então o caminho precisa ser absoluto. */
const logoUrl = (): string =>
  typeof window === 'undefined' ? logoPath : `${window.location.origin}${logoPath}`

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const dateTime = (iso: string): string =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const itemsHtml = (order: Order): string =>
  order.items
    .map((item) => {
      const complements = item.toppings.map((topping) => topping.name).join(', ')
      const detail = [
        `${item.product.baseLabel}: ${item.base.name}`,
        complements.length > 0 ? complements : '',
      ]
        .filter((part) => part.length > 0)
        .join(' · ')

      return `
        <div class="item">
          <div class="row">
            <span class="strong">${item.quantity}x ${escapeHtml(item.size.name)}</span>
            <span class="strong nowrap">${formatPrice(item.unitPrice * item.quantity)}</span>
          </div>
          <div class="small">${escapeHtml(detail)}</div>
          ${item.notes ? `<div class="small strong">Obs.: ${escapeHtml(item.notes)}</div>` : ''}
        </div>`
    })
    .join('')

const totalsHtml = (order: Order): string => {
  const subtotal = order.subtotal ?? order.total - (order.deliveryFee ?? 0)
  const fee = order.deliveryFee

  return `
    <div class="row"><span>Subtotal</span><span class="nowrap">${formatPrice(subtotal)}</span></div>
    ${
      isPickup(order.customer)
        ? '<div class="row"><span>Entrega</span><span class="nowrap">Retirada</span></div>'
        : fee === undefined
          ? ''
          : `<div class="row"><span>Entrega</span><span class="nowrap">${
              fee > 0 ? formatPrice(fee) : 'Grátis'
            }</span></div>`
    }
    <div class="row total"><span>TOTAL</span><span class="nowrap">${formatPrice(order.total)}</span></div>`
}

/** HTML completo do cupom, isolado do CSS do painel. */
export const receiptHtml = (order: Order): string => {
  const { customer } = order
  const address = [customer.address, customer.district, customer.city]
    .filter((part) => part && part.length > 0)
    .join(', ')

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Pedido #${escapeHtml(order.code)}</title>
<style>
  /* Margem zerada no @page e recuo feito no body: driver de térmica portátil
     costuma ignorar a margem da página e imprimir colado na borda. */
  @page { size: ${paperWidthMm}mm auto; margin: 0; }

  * { box-sizing: border-box; }

  body {
    width: ${printWidthMm}mm;
    margin: 0 auto;
    padding: 2mm 0 ${feedMm}mm;
    font-family: ui-monospace, "Courier New", monospace;
    font-size: 10px;
    line-height: 1.3;
    color: #000;
    background: #fff;
    /* Térmica só marca preto: cinza vira chuvisco ou some no papel. */
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Endereço e nome de complemento passam fácil dos ~32 caracteres da linha. */
  body, .row > span, dd { overflow-wrap: anywhere; }

  h1 { margin: 0; font-size: 13px; text-align: center; text-transform: uppercase; }
  /* Logo enxuta de propósito: cada milímetro dela é bobina gasta em todo pedido. */
  .logo { display: block; width: ${printWidthMm - 20}mm; height: auto; margin: 0 auto 3px; }
  [hidden] { display: none; }
  .center { text-align: center; }
  .small { font-size: 9px; }
  .strong { font-weight: 700; }
  /* Preço nunca quebra no meio: R$ 1 / 8,90 em linhas diferentes é ilegível. */
  .nowrap { overflow-wrap: normal; white-space: nowrap; }
  .code { margin: 5px 0 2px; font-size: 16px; font-weight: 700; text-align: center; }
  hr { border: 0; border-top: 1px dashed #000; margin: 5px 0; }
  .row { display: flex; align-items: baseline; justify-content: space-between; gap: 4px; }
  .item { margin-bottom: 5px; }
  .total { margin-top: 3px; font-size: 13px; font-weight: 700; }
  dl { margin: 0; }
  dt { font-weight: 700; }
  dd { margin: 0 0 4px; }
  footer { margin-top: 6px; text-align: center; font-size: 9px; }
</style>
</head>
<body>
  <img id="logo" class="logo" src="${logoUrl()}" alt="${escapeHtml(business.name)}" />
  <h1 id="brand" hidden>${escapeHtml(business.name)}</h1>
  <p class="center small">${escapeHtml(whatsappDisplay())}</p>
  <hr />

  <p class="code">PEDIDO #${escapeHtml(order.code)}</p>
  <p class="center small">${dateTime(order.createdAt)}</p>
  <hr />

  ${itemsHtml(order)}
  <hr />

  ${totalsHtml(order)}
  <hr />

  <dl>
    <dt>Cliente</dt>
    <dd>${escapeHtml(customer.name)} · ${escapeHtml(customer.phone)}</dd>
    <dt>Entrega</dt>
    <dd>${
      isPickup(customer)
        ? 'RETIRADA NO LOCAL'
        : `${escapeHtml(address)}${customer.reference ? ` (${escapeHtml(customer.reference)})` : ''}`
    }</dd>
    <dt>Pagamento</dt>
    <dd>${paymentLabels[customer.payment]}${
      customer.changeFor ? ` · troco para ${escapeHtml(customer.changeFor)}` : ''
    }</dd>
    ${customer.notes ? `<dt>Observações</dt><dd>${escapeHtml(customer.notes)}</dd>` : ''}
  </dl>

  <hr />
  <footer>
    Comprovante de pedido · não é documento fiscal<br />
    Obrigado pela preferência!
  </footer>
</body>
</html>`
}

/**
 * Resolve quando toda imagem do cupom terminou de carregar (ou falhou). O
 * teto de 3s evita que uma imagem travada segure a impressão para sempre.
 */
const imagesReady = (doc: Document): Promise<void> => {
  const pending = Array.from(doc.images)
    .filter((image) => !image.complete)
    .map(
      (image) =>
        new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true })
          image.addEventListener('error', () => resolve(), { once: true })
        }),
    )

  if (pending.length === 0) return Promise.resolve()

  const timeout = new Promise<void>((resolve) => {
    window.setTimeout(resolve, 3000)
  })
  return Promise.race([Promise.all(pending).then(() => undefined), timeout])
}

/**
 * Manda o cupom para a impressora usando um iframe escondido: o painel não
 * sai da tela e o navegador não bloqueia como bloquearia um popup.
 */
export const printReceipt = (order: Order): void => {
  if (typeof document === 'undefined') return

  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.position = 'fixed'
  frame.style.right = '0'
  frame.style.bottom = '0'
  frame.style.width = '0'
  frame.style.height = '0'
  frame.style.border = '0'

  const cleanup = () => {
    window.setTimeout(() => frame.remove(), 1000)
  }

  frame.onload = () => {
    const view = frame.contentWindow
    if (!view) {
      cleanup()
      return
    }
    view.onafterprint = cleanup

    // Sem esperar a logo, a janela de impressão abre com um buraco no topo.
    void imagesReady(view.document).then(() => {
      try {
        view.focus()
        view.print()
      } catch {
        cleanup()
      }
    })
  }

  document.body.append(frame)

  const doc = frame.contentDocument
  if (!doc) {
    frame.remove()
    return
  }
  doc.open()
  doc.write(receiptHtml(order))
  doc.close()

  // O fallback é registrado daqui, e não com um `onerror` no HTML: a CSP do
  // site proíbe script inline, e o iframe herda essa política.
  const logo = doc.getElementById('logo')
  logo?.addEventListener(
    'error',
    () => {
      logo.setAttribute('hidden', '')
      doc.getElementById('brand')?.removeAttribute('hidden')
    },
    { once: true },
  )
}
