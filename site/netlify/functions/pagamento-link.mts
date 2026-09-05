import {
  CHECKOUT_API,
  admin,
  infinitePayHandle,
  isForeignOrigin,
  json,
  rateLimited,
  toCents,
} from './_shared.mts'

/**
 * Gera o link de pagamento da InfinitePay para um pedido que já existe.
 *
 * O site manda só o número do pedido. Quanto custa, quem diz é o banco: o
 * total sai da linha da tabela `orders`, gravada pela `create_order`, que por
 * sua vez recalculou tudo a partir do cardápio. Nenhum valor vindo do
 * navegador atravessa até a cobrança.
 *
 * POST /api/pagamento-link  { "code": "1042" }  ->  { "url": "https://..." }
 *
 * O número do pedido é sequencial e curto, então serve de chave para quem
 * quiser varrer: #1000, #1001, #1002. Contra isso valem três cercas — a
 * chamada precisa vir da própria loja quando vem de navegador, o endereço de
 * rede tem um teto de tentativas, e só pedido recente gera cobrança. Pedido de
 * ontem não abre checkout para estranho nenhum.
 */

/** Depois disso o pedido é assunto encerrado: quem for pagar, pagou. */
const JANELA_DE_PAGAMENTO_MS = 2 * 60 * 60 * 1000

interface OrderRow {
  readonly id: string
  readonly code: string
  readonly created_at: string
  readonly total: number
  readonly subtotal: number
  readonly delivery_fee: number
  readonly payment_status: string
  readonly items: readonly CartLine[]
  readonly customer: { readonly name?: string; readonly phone?: string } | null
}

interface CartLine {
  readonly quantity: number
  readonly unitPrice: number
  readonly size?: { readonly name?: string }
  readonly base?: { readonly name?: string }
}

interface CheckoutItem {
  readonly quantity: number
  /** Em centavos: R$ 10,00 = 1000. */
  readonly price: number
  readonly description: string
}

/**
 * O que o cliente vê na tela do checkout. Cada item do pedido vira uma linha,
 * mais a entrega, para ele reconhecer o que está pagando.
 *
 * A conferência no fim não é decoração: a soma das linhas tem que bater com o
 * total do banco no centavo. Se não bater (item antigo sem preço unitário, por
 * exemplo), a cobrança vai como uma linha só, pelo valor certo, em vez de sair
 * um pedido cobrado a menos.
 */
const checkoutItems = (order: OrderRow): readonly CheckoutItem[] => {
  const single: readonly CheckoutItem[] = [
    { quantity: 1, price: toCents(order.total), description: `Pedido #${order.code} - Açaiteria MR` },
  ]

  const lines: CheckoutItem[] = order.items.map((item) => ({
    quantity: item.quantity,
    price: toCents(item.unitPrice),
    description: [item.size?.name, item.base?.name].filter(Boolean).join(' - ') || 'Item do pedido',
  }))

  if (order.delivery_fee > 0) {
    lines.push({ quantity: 1, price: toCents(order.delivery_fee), description: 'Taxa de entrega' })
  }

  const sum = lines.reduce((total, line) => total + line.price * line.quantity, 0)
  return lines.length > 0 && sum === toCents(order.total) ? lines : single
}

export default async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') return json({ error: 'Método não permitido' }, 405)
  if (isForeignOrigin(request)) return json({ error: 'Origem não permitida' }, 403)
  if (rateLimited(request, 12, 60_000)) return json({ error: 'Muitas tentativas. Aguarde.' }, 429)

  let code: string
  try {
    const body = (await request.json()) as { code?: unknown }
    code = String(body.code ?? '').trim()
  } catch {
    return json({ error: 'Corpo inválido' }, 400)
  }

  if (!/^\d{1,12}$/.test(code)) return json({ error: 'Número de pedido inválido' }, 400)

  try {
    const db = admin()

    const { data, error } = await db
      .from('orders')
      .select('id, code, created_at, total, subtotal, delivery_fee, payment_status, items, customer')
      .eq('code', code)
      .maybeSingle()

    if (error) throw error
    const order = data as OrderRow | null
    if (!order) return json({ error: 'Pedido não encontrado' }, 404)
    if (order.payment_status === 'pago') return json({ error: 'Este pedido já foi pago' }, 409)
    if (order.total <= 0) return json({ error: 'Pedido sem valor a cobrar' }, 422)

    const idade = Date.now() - new Date(order.created_at).getTime()
    if (!Number.isFinite(idade) || idade > JANELA_DE_PAGAMENTO_MS) {
      return json({ error: 'Pedido antigo demais para pagar pelo site.' }, 410)
    }

    // A origem do próprio pedido HTTP: em produção o domínio da loja, no
    // deploy de preview o endereço do preview. Assim o cliente sempre volta
    // para o site de onde saiu, sem ninguém manter uma URL na mão.
    const site = new URL(request.url).origin

    const response = await fetch(`${CHECKOUT_API}/links`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        handle: infinitePayHandle(),
        // O identificador do pedido no nosso banco viaja com a cobrança e
        // volta no webhook. É por ele que o pagamento reencontra o pedido.
        order_nsu: order.id,
        redirect_url: `${site}/?pedido=${order.code}&pago=1`,
        webhook_url: `${site}/api/infinitepay-webhook`,
        items: checkoutItems(order),
        customer: {
          name: order.customer?.name ?? '',
          phone_number: order.customer?.phone ?? '',
        },
      }),
    })

    // A InfinitePay devolve o link em `checkout_url` (é o que o gerador de
    // payload do app deles mostra no "Teste da API"). Parte da documentação
    // escrita chama o mesmo campo de `url`, então os dois são aceitos: assim o
    // pagamento não para se eles padronizarem para um lado ou para o outro.
    const payload = (await response.json().catch(() => null)) as
      | { checkout_url?: string; url?: string }
      | null

    const checkoutUrl = payload?.checkout_url ?? payload?.url

    if (!response.ok || !checkoutUrl) {
      // Sem o corpo da resposta no log: ele volta com os dados do cliente que
      // acabaram de subir na cobrança, e log de deploy não é lugar para isso.
      console.error('InfinitePay recusou o link', response.status)
      return json({ error: 'Não foi possível abrir o pagamento agora.' }, 502)
    }

    // Só depois de existir link o pedido entra em "aguardando": marcar antes
    // deixaria pedido pendurado esperando um pagamento que nunca começou.
    const { error: markError } = await db.rpc('start_online_payment', { p_order_id: order.id })
    if (markError) console.error('Falha ao marcar pagamento iniciado', markError)

    return json({ url: checkoutUrl })
  } catch (cause) {
    console.error('Erro ao gerar link de pagamento', cause)
    return json({ error: 'Não foi possível abrir o pagamento agora.' }, 500)
  }
}
