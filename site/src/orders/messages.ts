import { business } from '../config/business'
import { formatPrice } from '../lib/order'
import type { Order, OrderStatus } from './types'
import { paymentLabels } from './types'

/**
 * Avisos de status enviados ao cliente pelo WhatsApp.
 *
 * Não existe push automático: o site é estático e não tem servidor para
 * disparar mensagem sozinho. O que o painel faz é abrir a conversa do cliente
 * com o texto pronto do status: um clique, sem digitar nada.
 *
 * Ver `docs/whatsapp-automatico.md` para o que falta se um dia o envio tiver
 * que sair sozinho, sem ninguém apertar enviar.
 */

/**
 * Origem usada nos links mandados ao cliente. O painel é servido pelo mesmo
 * host do site, então a origem atual sempre aponta para o lugar certo: em
 * produção o domínio, em `localhost` o próprio ambiente de teste.
 */
const siteBase = (): string => window.location.origin || business.siteUrl

/** Link em que o cliente confirma que o pedido chegou. */
export const confirmUrl = (code: string): string => `${siteBase()}/?pedido=${code}`

const firstName = (name: string): string => name.trim().split(' ')[0] ?? name

const describeItem = (item: Order['items'][number]): string => {
  const toppings =
    item.toppings.length > 0 ? item.toppings.map((topping) => topping.name).join(', ') : 'sem complementos'
  const line = `${item.quantity}x ${item.size.name} com ${item.base.name} (${toppings}): ${formatPrice(item.unitPrice * item.quantity)}`
  return item.notes ? `${line}\n   Obs.: ${item.notes}` : line
}

/** Mensagem que a loja recebe no WhatsApp, espelhando o pedido do sistema. */
export const orderMessage = (order: Order): string => {
  const { customer } = order
  const fee = order.deliveryFee ?? 0

  return [
    `*${business.name}: pedido #${order.code}*`,
    '',
    order.items.map(describeItem).join('\n'),
    '',
    `Itens: ${formatPrice(order.subtotal ?? order.total)}`,
    `Entrega: ${fee === 0 ? 'grátis' : formatPrice(fee)}`,
    `*Total: ${formatPrice(order.total)}*`,
    `Pagamento: ${paymentLabels[customer.payment]}${customer.changeFor ? ` (troco para ${customer.changeFor})` : ''}`,
    '',
    `Nome: ${customer.name}`,
    `Telefone: ${customer.phone}`,
    `Endereço: ${customer.address}`,
    customer.reference ? `Referência: ${customer.reference}` : '',
    customer.notes ? `Observações: ${customer.notes}` : '',
  ]
    .filter((line) => line !== '')
    .join('\n')
}

export const statusMessage = (order: Order, status: OrderStatus): string => {
  const name = firstName(order.customer.name)
  const code = `#${order.code}`

  switch (status) {
    case 'novo':
      return `Oi ${name}! Recebemos seu pedido ${code} aqui na ${business.name}. Já vamos confirmar tudo. 💜`
    case 'preparando':
      return `Oi ${name}! Seu pedido ${code} já está sendo preparado. Em breve sai para entrega. 💜`
    case 'entrega':
      return `Oi ${name}! Seu pedido ${code} saiu para entrega e chega em cerca de ${business.delivery.averageMinutes} minutos. Fica de olho! 🛵`
    case 'concluido':
      return `Pedido ${code} entregue, ${name}! Confirma pra gente que chegou tudo certo? É só tocar aqui: ${confirmUrl(order.code)} 💜`
    case 'cancelado':
      return `Oi ${name}, precisamos cancelar seu pedido ${code} (${formatPrice(order.total)}). Qualquer dúvida é só responder por aqui que a gente resolve.`
  }
}

/** Link do WhatsApp do cliente já com o aviso do status escrito. */
export const notifyUrl = (order: Order, status: OrderStatus): string => {
  const digits = order.customer.phone.replace(/\D/g, '').replace(/^55/, '')
  return `https://wa.me/55${digits}?text=${encodeURIComponent(statusMessage(order, status))}`
}
