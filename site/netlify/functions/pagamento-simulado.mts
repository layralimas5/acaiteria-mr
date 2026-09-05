import { admin, json, rateLimited, simulacaoDePagamento, toCents } from './_shared.mts'

/**
 * Checkout de mentira, para teste.
 *
 * A InfinitePay não tem ambiente de testes: link de cobrança lá é cobrança de
 * verdade, no cartão de verdade de alguém. Esta função ocupa esse lugar
 * enquanto o fluxo está sendo testado — mostra o valor do pedido e dois
 * botões, aprovar e recusar, e devolve o cliente para o site como o checkout
 * real devolveria.
 *
 * Aprovar chama a mesma `mark_order_paid` que o webhook chama, então o que
 * acontece daqui para frente (pedido pago no painel, tela de retorno, cupom)
 * é exatamente o que acontece no pagamento real. O que este caminho NÃO testa
 * é a conversa com a InfinitePay em si: link gerado, webhook recebido,
 * `payment_check` conferido. Isso só um pagamento real mostra.
 *
 * Fora do modo de teste a função responde 404, como se não existisse.
 *
 * GET  /api/pagamento-simulado?pedido=<uuid>   a tela
 * POST /api/pagamento-simulado                 aprova ou recusa e redireciona
 */

interface OrderRow {
  readonly id: string
  readonly code: string
  readonly total: number
  readonly payment_status: string
}

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

const reais = (value: number): string =>
  (Math.round(value * 100) / 100).toFixed(2).replace('.', ',')

/** Sem script na página: o Content-Security-Policy do site só aceita 'self'. */
const pagina = (order: OrderRow): Response =>
  new Response(
    `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Checkout de teste - Pedido #${order.code}</title>
</head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#1a0b2e;color:#fff;font-family:system-ui,sans-serif;padding:24px">
<main style="width:100%;max-width:420px;background:#2a1445;border:1px solid #4a2a6a;border-radius:16px;padding:28px">
  <p style="margin:0 0 20px;padding:10px 14px;background:#f5c518;color:#1a0b2e;border-radius:8px;font-weight:700;font-size:14px">
    Checkout de teste. Nenhum dinheiro sai daqui.
  </p>
  <h1 style="margin:0 0 4px;font-size:20px">Pedido #${order.code}</h1>
  <p style="margin:0 0 24px;font-size:32px;font-weight:700">R$ ${reais(order.total)}</p>
  <form method="post" action="/api/pagamento-simulado">
    <input type="hidden" name="pedido" value="${order.id}">
    <button type="submit" name="acao" value="aprovar"
      style="width:100%;padding:14px;border:0;border-radius:10px;background:#22c55e;color:#052e12;font-size:16px;font-weight:700;cursor:pointer">
      Aprovar pagamento
    </button>
    <button type="submit" name="acao" value="recusar"
      style="width:100%;margin-top:10px;padding:14px;border:1px solid #4a2a6a;border-radius:10px;background:transparent;color:#fff;font-size:16px;cursor:pointer">
      Recusar
    </button>
  </form>
</main>
</body>
</html>`,
    { headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex, nofollow' } },
  )

const voltaParaOSite = (request: Request, code: string, pago: boolean): Response => {
  const site = new URL(request.url).origin
  const destino = pago ? `${site}/?pedido=${code}&pago=1` : `${site}/?pedido=${code}`
  return new Response(null, { status: 303, headers: { location: destino } })
}

export default async (request: Request): Promise<Response> => {
  if (!simulacaoDePagamento()) return json({ error: 'Não encontrado' }, 404)
  if (rateLimited(request, 30, 60_000)) return json({ error: 'Muitas tentativas' }, 429)

  const db = admin()

  const buscar = async (id: string): Promise<OrderRow | null> => {
    const { data, error } = await db
      .from('orders')
      .select('id, code, total, payment_status')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return (data as OrderRow | null) ?? null
  }

  try {
    if (request.method === 'GET') {
      const id = new URL(request.url).searchParams.get('pedido') ?? ''
      if (!isUuid(id)) return json({ error: 'Pedido inválido' }, 400)

      const order = await buscar(id)
      if (!order) return json({ error: 'Pedido não encontrado' }, 404)
      if (order.payment_status === 'pago') return voltaParaOSite(request, order.code, true)

      return pagina(order)
    }

    if (request.method !== 'POST') return json({ error: 'Método não permitido' }, 405)

    const form = await request.formData()
    const id = String(form.get('pedido') ?? '')
    const acao = String(form.get('acao') ?? '')
    if (!isUuid(id)) return json({ error: 'Pedido inválido' }, 400)

    const order = await buscar(id)
    if (!order) return json({ error: 'Pedido não encontrado' }, 404)

    if (acao !== 'aprovar') return voltaParaOSite(request, order.code, false)
    if (order.payment_status === 'pago') return voltaParaOSite(request, order.code, true)

    // A mesma função que o webhook da InfinitePay chama, com o mesmo formato
    // de valor em centavos no identificador, para o pedido de teste ficar
    // reconhecível no painel e nos relatórios.
    const { error } = await db.rpc('mark_order_paid', {
      p_order_id: order.id,
      p_nsu: `TESTE-${toCents(order.total)}`,
      p_receipt_url: null,
    })

    if (error) {
      console.error('Falha ao carimbar pagamento de teste', error)
      return json({ error: 'Não foi possível concluir o teste.' }, 500)
    }

    return voltaParaOSite(request, order.code, true)
  } catch (cause) {
    console.error('Erro no checkout de teste', cause)
    return json({ error: 'Erro interno' }, 500)
  }
}
