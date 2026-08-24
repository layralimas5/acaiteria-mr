import { business } from '../config/business'
import { formatPrice, whatsappDisplay } from '../lib/order'
import type { Order } from './types'
import { paymentLabels } from './types'

/**
 * Comprovante de pedido para impressão. Não é documento fiscal: é o cupom que
 * a loja imprime para separar o pedido e mandar junto com a entrega.
 *
 * A largura é a da bobina térmica (80mm). Em impressora comum (A4) o mesmo
 * cupom sai centralizado no alto da folha, sem quebrar.
 */

/**
 * Logo impressa no topo do cupom. É uma versão preto e branco da marca
 * (`logo-print.png`), não a oficial: o fundo roxo da arte original viraria um
 * bloco preto na bobina térmica e comeria tinta na impressora comum.
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
            <span class="strong">${formatPrice(item.unitPrice * item.quantity)}</span>
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
    <div class="row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
    ${
      fee === undefined
        ? ''
        : `<div class="row"><span>Entrega</span><span>${
            fee > 0 ? formatPrice(fee) : 'Grátis'
          }</span></div>`
    }
    <div class="row total"><span>TOTAL</span><span>${formatPrice(order.total)}</span></div>`
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
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0 auto;
    width: 72mm;
    font-family: ui-monospace, "Courier New", monospace;
    font-size: 12px;
    line-height: 1.35;
    color: #000;
  }
  h1 { margin: 0; font-size: 15px; text-align: center; text-transform: uppercase; }
  .logo { display: block; width: 26mm; height: auto; margin: 0 auto 4px; }
  [hidden] { display: none; }
  .center { text-align: center; }
  .small { font-size: 11px; }
  .strong { font-weight: 700; }
  .code { margin: 6px 0; font-size: 20px; font-weight: 700; text-align: center; }
  hr { border: 0; border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; gap: 8px; }
  .item { margin-bottom: 6px; }
  .total { margin-top: 4px; font-size: 15px; font-weight: 700; }
  dl { margin: 0; }
  dt { font-weight: 700; }
  dd { margin: 0 0 4px; }
  footer { margin-top: 8px; text-align: center; font-size: 10px; }
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
    <dd>${escapeHtml(address)}${customer.reference ? ` (${escapeHtml(customer.reference)})` : ''}</dd>
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
