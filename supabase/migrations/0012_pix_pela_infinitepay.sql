-- =============================================================================
-- Açaiteria MR: o Pix passa a ser cobrado pela InfinitePay.
--
-- Roda inteiro no SQL Editor do Supabase, de uma vez só. É idempotente.
--
-- Uma versão anterior desta migration (0012_pix_a_conferir) criava um trigger
-- que fazia o pedido no Pix manual nascer `aguardando`, para a loja conferir
-- o extrato e carimbar `pago` à mão. Esse caminho saiu: o Pix agora vai pelo
-- checkout da InfinitePay, junto com o cartão, e o webhook confirma sozinho.
-- Se aquele trigger chegou a ser criado, este arquivo o remove. Se não, não
-- faz nada.
-- =============================================================================

drop trigger if exists orders_default_payment_status on public.orders;
drop function if exists public.orders_default_payment_status();

comment on column public.orders.payment_status is
  'na_entrega: paga quando receber. aguardando: checkout online ainda não confirmado. pago: confirmado pela InfinitePay via webhook. falhou: cobrança recusada ou expirada.';
