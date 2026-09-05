import { CHECKOUT_API, admin, infinitePayHandle, json, rateLimited, toCents } from './_shared.mts'

/**
 * Confirmação de pagamento vinda da InfinitePay.
 *
 * O webhook chega sem assinatura, então o corpo dele sozinho não prova nada:
 * qualquer pessoa que descubra o endereço consegue postar um JSON dizendo que
 * o pedido #1042 foi pago. Por isso nada aqui é aceito de graça — o que o
 * webhook faz é avisar que existe algo para conferir, e a confirmação de
 * verdade vem de uma segunda chamada à API da InfinitePay (`/payment_check`),
 * que responde a partir do que está registrado lá.
 *
 * O valor também é conferido: pagamento menor que o total do pedido não
 * carimba "pago".
 *
 * Responde 200 quando terminou de tratar e 400 quando quer ser reenviado. A
 * InfinitePay repete o envio enquanto não receber 200.
 */

interface WebhookBody {
  readonly order_nsu?: string
  readonly transaction_nsu?: string
  readonly invoice_slug?: string
  readonly receipt_url?: string
}

interface PaymentCheck {
  readonly success?: boolean
  readonly paid?: boolean
  readonly amount?: number
  readonly paid_amount?: number
}

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

export default async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') return json({ error: 'Método não permitido' }, 405)

  // A InfinitePay reenvia enquanto não recebe 200, então o volume normal é
  // baixo. Este teto só existe para quem descobrir o endereço e resolver
  // martelar: cada tentativa aqui vira uma consulta ao banco e uma chamada à
  // API deles.
  if (rateLimited(request, 60, 60_000)) return json({ error: 'Muitas tentativas' }, 429)

  let body: WebhookBody
  try {
    body = (await request.json()) as WebhookBody
  } catch {
    // Corpo ilegível não melhora sendo reenviado: encerra com 200.
    return json({ received: true })
  }

  const orderId = String(body.order_nsu ?? '')
  const transactionNsu = String(body.transaction_nsu ?? '')
  const slug = String(body.invoice_slug ?? '')

  if (!isUuid(orderId)) return json({ received: true })

  try {
    const db = admin()

    const { data, error } = await db
      .from('orders')
      .select('id, total, payment_status')
      .eq('id', orderId)
      .maybeSingle()

    if (error) throw error
    const order = data as { id: string; total: number; payment_status: string } | null

    // Pedido que não existe aqui não é problema nosso, e já pago é reenvio:
    // nos dois casos o assunto está encerrado.
    if (!order) return json({ received: true })
    if (order.payment_status === 'pago') return json({ received: true })

    const check = await fetch(`${CHECKOUT_API}/payment_check`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        handle: infinitePayHandle(),
        order_nsu: orderId,
        transaction_nsu: transactionNsu,
        slug,
      }),
    })

    const result = (await check.json().catch(() => null)) as PaymentCheck | null

    // A InfinitePay fora do ar é motivo para reenviar: 400 pede a repetição.
    if (!check.ok || !result) {
      console.error('payment_check indisponível', check.status)
      return json({ error: 'Confirmação indisponível' }, 400)
    }

    if (result.paid !== true) {
      console.warn('Webhook sem pagamento confirmado', orderId)
      return json({ received: true })
    }

    // Os valores da InfinitePay já vêm em centavos, como os que mandamos.
    const paid = Math.round(Number(result.paid_amount ?? result.amount ?? 0))
    if (paid < toCents(order.total)) {
      console.error('Pagamento menor que o pedido', orderId, paid, toCents(order.total))
      return json({ received: true })
    }

    const { error: markError } = await db.rpc('mark_order_paid', {
      p_order_id: orderId,
      p_nsu: transactionNsu || null,
      p_receipt_url: body.receipt_url ?? null,
    })

    if (markError) {
      console.error('Falha ao carimbar pagamento', markError)
      return json({ error: 'Falha ao gravar' }, 400)
    }

    return json({ received: true })
  } catch (cause) {
    console.error('Erro no webhook da InfinitePay', cause)
    return json({ error: 'Erro interno' }, 400)
  }
}
