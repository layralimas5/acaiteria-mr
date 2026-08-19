-- =============================================================================
-- Criação de pedido pelo site.
--
-- O cliente precisa receber de volta o número do pedido (#1000) para a
-- mensagem do WhatsApp e para o link de confirmação. Só que ele não pode ler
-- a tabela de pedidos, que guarda dados de outras pessoas: um `insert ...
-- returning` esbarra no RLS e o pedido não sai.
--
-- A saída é esta função: ela grava e devolve apenas o identificador, o número
-- e a hora do pedido recém-criado. Nada de outro cliente atravessa.
--
-- De quebra, o total passa a ser calculado no banco. Antes vinha pronto do
-- navegador, o que deixava a conta na mão de quem faz o pedido.
-- =============================================================================

create or replace function public.create_order(
  p_customer jsonb,
  p_items jsonb,
  p_subtotal numeric,
  p_delivery_fee numeric
)
returns table (id uuid, code text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Pedido sem itens';
  end if;

  if p_customer is null or coalesce(trim(p_customer ->> 'name'), '') = '' then
    raise exception 'Pedido sem nome de cliente';
  end if;

  if p_subtotal < 0 or p_delivery_fee < 0 then
    raise exception 'Valores negativos no pedido';
  end if;

  return query
  insert into public.orders (customer, items, subtotal, delivery_fee, total)
  values (p_customer, p_items, p_subtotal, p_delivery_fee, p_subtotal + p_delivery_fee)
  returning orders.id, orders.code, orders.created_at;
end;
$fn$;

revoke all on function public.create_order(jsonb, jsonb, numeric, numeric) from public;
grant execute on function public.create_order(jsonb, jsonb, numeric, numeric) to anon, authenticated;

-- Com a função no lugar, o site não precisa mais escrever direto na tabela, e
-- deixar essa porta aberta só permitiria inventar total, status e número.
drop policy if exists "pedido criado pelo site" on public.orders;

-- Limpeza dos registros que o desenvolvimento criou para testar as regras de
-- segurança. Não fazem falta a ninguém e a loja não deve começar com eles.
delete from public.orders where customer ->> 'name' like 'TESTE%';
delete from public.reviews where customer_name like 'TESTE%';
