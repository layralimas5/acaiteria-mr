import { business } from '../config/business'
import { formatPrice } from '../lib/order'
import type { Order, OrderStatus } from './types'

/**
 * Avisos de status enviados ao cliente pelo WhatsApp.
 *
 * Não existe push automático: o site é estático e não tem servidor para
 * disparar mensagem sozinho. O que o painel faz é abrir a conversa do cliente
 * com o texto pronto do status — um clique, sem digitar nada.
 */

const firstName = (name: string): string => name.trim().split(' ')[0] ?? name

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
      return `Pedido ${code} entregue! Obrigado pela preferência, ${name}. Se curtir, marca a gente no Instagram @${business.instagramHandle} 💜`
    case 'cancelado':
      return `Oi ${name}, precisamos cancelar seu pedido ${code} (${formatPrice(order.total)}). Qualquer dúvida é só responder por aqui que a gente resolve.`
  }
}

/** Link do WhatsApp do cliente já com o aviso do status escrito. */
export const notifyUrl = (order: Order, status: OrderStatus): string => {
  const digits = order.customer.phone.replace(/\D/g, '').replace(/^55/, '')
  return `https://wa.me/55${digits}?text=${encodeURIComponent(statusMessage(order, status))}`
}
