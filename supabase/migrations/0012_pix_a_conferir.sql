-- =============================================================================
-- Açaiteria MR: pedido no Pix nasce com o pagamento em aberto.
--
-- Roda inteiro no SQL Editor do Supabase, de uma vez só. É idempotente.
-- Depende da 0004 (colunas de pagamento).
--
-- O que muda: até aqui o pedido no Pix entrava como `na_entrega`, igual ao
-- dinheiro, e o painel não tinha como dizer "esse ainda não pagou". Como o
-- banco não avisa o site quando o Pix cai, a conferência é da loja: o pedido
-- entra `aguardando`, o card mostra valor e referência para bater com o
-- extrato, e alguém da equipe carimba `pago` com um clique.
--
-- O carimbo é um update direto na linha, feito pelo painel (logado). A
-- policy "pedidos da loja" já cobre isso. O cliente continua sem poder ler
-- nem escrever em pedido nenhum.
-- =============================================================================

create or replace function public.orders_default_payment_status()
returns trigger
language plpgsql
as $fn$
begin
  if new.customer->>'payment' = 'pix' and new.payment_status = 'na_entrega' then
    new.payment_status := 'aguardando';
    new.payment_provider := 'pix';
  end if;
  return new;
end;
$fn$;

drop trigger if exists orders_default_payment_status on public.orders;
create trigger orders_default_payment_status
  before insert on public.orders
  for each row execute function public.orders_default_payment_status();

comment on column public.orders.payment_status is
  'na_entrega: paga quando receber. aguardando: Pix ou checkout online ainda não confirmado. pago: confirmado (InfinitePay pelo webhook, Pix pela loja no extrato). falhou: cobrança recusada ou expirada.';
