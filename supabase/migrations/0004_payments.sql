-- =============================================================================
-- Açaiteria MR: pagamento online pelo site (InfinitePay).
--
-- Roda inteiro no SQL Editor do Supabase, de uma vez só. É idempotente.
--
-- O que muda: o pedido passa a carregar o estado do pagamento. Até hoje todo
-- pedido era pago na entrega, então não havia o que guardar. Com o checkout da
-- InfinitePay, o cliente paga antes de a loja começar a preparar, e a loja
-- precisa enxergar isso na tela do pedido, sem depender de olhar o app do
-- banco.
--
-- Quem carimba "pago" NÃO é o navegador do cliente: é a função servidor que
-- recebe o webhook da InfinitePay e confere a cobrança na API deles antes de
-- gravar (site/netlify/functions/infinitepay-webhook.mts). O cliente só lê.
-- =============================================================================

-- =============================================================================
-- 1. Colunas de pagamento
-- =============================================================================

alter table public.orders
  add column if not exists payment_status text not null default 'na_entrega',
  add column if not exists payment_provider text,
  -- Identificador da transação na InfinitePay, para achar a venda no extrato.
  add column if not exists payment_nsu text,
  -- Comprovante que a InfinitePay gera. É o que a loja abre em caso de dúvida.
  add column if not exists payment_receipt_url text,
  add column if not exists paid_at timestamptz;

alter table public.orders drop constraint if exists orders_payment_status_valido;
alter table public.orders add constraint orders_payment_status_valido check (
  payment_status in ('na_entrega', 'aguardando', 'pago', 'falhou')
) not valid;

comment on column public.orders.payment_status is
  'na_entrega: paga quando receber. aguardando: mandado para o checkout, ainda não pagou. pago: confirmado pela InfinitePay. falhou: cobrança recusada ou expirada.';

create index if not exists orders_payment_status_idx on public.orders (payment_status);

-- =============================================================================
-- 2. O checkout online marca o pedido como "aguardando"
--
-- Chamada pela função servidor logo antes de gerar o link de pagamento. Fica
-- como função (e não update solto) para o estado nascer certo em um lugar só.
-- =============================================================================

create or replace function public.start_online_payment(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  update public.orders
     set payment_status = 'aguardando',
         payment_provider = 'infinitepay'
   where id = p_order_id
     and payment_status in ('na_entrega', 'aguardando', 'falhou');
end;
$fn$;

revoke all on function public.start_online_payment(uuid) from public;
grant execute on function public.start_online_payment(uuid) to service_role;

-- =============================================================================
-- 3. Confirmação do pagamento
--
-- Só o service_role executa: quem chama é o webhook, do lado do servidor,
-- depois de conferir a cobrança na API da InfinitePay. Nunca o navegador.
--
-- Idempotente de propósito: a InfinitePay reenvia o webhook quando não recebe
-- 200 rápido, e o mesmo pagamento não pode virar dois carimbos diferentes.
-- =============================================================================

create or replace function public.mark_order_paid(
  p_order_id uuid,
  p_nsu text,
  p_receipt_url text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_updated integer;
begin
  update public.orders
     set payment_status = 'pago',
         payment_provider = 'infinitepay',
         payment_nsu = coalesce(p_nsu, payment_nsu),
         payment_receipt_url = coalesce(p_receipt_url, payment_receipt_url),
         paid_at = coalesce(paid_at, now())
   where id = p_order_id;

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$fn$;

revoke all on function public.mark_order_paid(uuid, text, text) from public;
grant execute on function public.mark_order_paid(uuid, text, text) to service_role;

-- =============================================================================
-- 4. O cliente perguntando se o pagamento dele caiu
--
-- Volta do checkout com o número do pedido na mão e precisa ver "pago" na
-- tela. Devolve uma palavra só: nada de nome, telefone ou endereço de
-- ninguém, mesmo se alguém ficar chutando números de pedido.
-- =============================================================================

create or replace function public.order_payment_status(p_code text)
returns text
language sql
stable
security definer
set search_path = public
as $fn$
  select payment_status from public.orders where code = p_code;
$fn$;

revoke all on function public.order_payment_status(text) from public;
grant execute on function public.order_payment_status(text) to anon, authenticated;
