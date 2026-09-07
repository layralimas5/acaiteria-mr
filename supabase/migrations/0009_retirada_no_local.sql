-- =============================================================================
-- Açaiteria MR: retirada no local.
--
-- Roda inteiro no SQL Editor do Supabase, de uma vez só. É idempotente.
--
-- O cliente passa a escolher, no checkout, entre receber em casa e buscar o
-- pedido na loja. A escolha vai no JSON do cliente (`customer.fulfillment`),
-- então não há coluna nova: o que muda aqui é a função que grava o pedido.
--
--   1. `fulfillment` só aceita 'entrega' ou 'retirada'. Ausente vale entrega,
--      que é o que todo pedido anterior a esta migration era.
--
--   2. Pedido de retirada grava taxa zero, mesmo que o navegador mande outro
--      valor: quem busca na loja não paga entrega, e isso é decidido aqui, não
--      no cliente.
--
-- O resto da função é o que já valia na 0008, sem alteração.
-- =============================================================================

drop function if exists public.create_order(jsonb, jsonb, numeric, numeric);

create function public.create_order(
  p_customer jsonb,
  p_items jsonb,
  p_subtotal numeric,
  p_delivery_fee numeric
)
returns table (id uuid, code text, created_at timestamptz, subtotal numeric, delivery_fee numeric, total numeric)
language plpgsql
security definer
set search_path = public
as $fn$
declare
  -- Teto da taxa de entrega. As áreas atendidas custam entre R$ 3 e R$ 6; o
  -- valor não mora no banco, então o que dá para fazer é impedir absurdo.
  c_max_delivery_fee constant numeric := 30;
  -- Anti-flood. Generoso para o movimento real, apertado para robô.
  c_max_por_minuto constant integer := 20;
  c_max_por_telefone constant integer := 3;
  v_subtotal numeric;
  v_fee numeric;
  v_phone text;
  v_recentes integer;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Pedido sem itens';
  end if;

  -- Teto de tamanho: sem isso um único pedido podia gravar megabytes.
  if jsonb_array_length(p_items) > 50
     or length(p_items::text) > 60000
     or length(p_customer::text) > 4000 then
    raise exception 'Pedido grande demais';
  end if;

  if p_customer is null or coalesce(trim(p_customer ->> 'name'), '') = '' then
    raise exception 'Pedido sem nome de cliente';
  end if;

  select count(*) into v_recentes
    from public.orders
   where orders.created_at > now() - interval '1 minute';

  if v_recentes >= c_max_por_minuto then
    raise exception 'Muitos pedidos ao mesmo tempo. Tente de novo em instantes.';
  end if;

  -- Só dígitos: o mesmo telefone digitado de dois jeitos é o mesmo telefone.
  v_phone := regexp_replace(coalesce(p_customer ->> 'phone', ''), '\D', '', 'g');

  if length(v_phone) >= 10 then
    select count(*) into v_recentes
      from public.orders
     where orders.created_at > now() - interval '2 minutes'
       and regexp_replace(coalesce(orders.customer ->> 'phone', ''), '\D', '', 'g') = v_phone;

    if v_recentes >= c_max_por_telefone then
      raise exception 'Voce ja fez pedidos agora ha pouco. Aguarde alguns minutos.';
    end if;
  end if;

  -- Os campos do cliente têm limite no formulário do site (maxLength), e
  -- limite no formulário é sugestão: quem chama a função direto manda o que
  -- quiser. Os mesmos tetos valem aqui, com folga sobre o que o site aceita.
  if length(coalesce(p_customer ->> 'name', '')) > 120
     or length(coalesce(p_customer ->> 'phone', '')) > 30
     or length(coalesce(p_customer ->> 'address', '')) > 300
     or length(coalesce(p_customer ->> 'district', '')) > 120
     or length(coalesce(p_customer ->> 'city', '')) > 120
     or length(coalesce(p_customer ->> 'reference', '')) > 300
     or length(coalesce(p_customer ->> 'notes', '')) > 800
     or length(coalesce(p_customer ->> 'changeFor', '')) > 30 then
    raise exception 'Dados do cliente acima do tamanho permitido';
  end if;

  if coalesce(p_customer ->> 'payment', 'dinheiro')
     not in ('online', 'pix', 'dinheiro', 'cartao') then
    raise exception 'Forma de pagamento invalida';
  end if;

  -- Entrega ou retirada. Ausente nos pedidos gravados antes de a retirada
  -- existir, e ausente vale entrega: é o que todos eles eram.
  if coalesce(p_customer ->> 'fulfillment', 'entrega') not in ('entrega', 'retirada') then
    raise exception 'Forma de recebimento invalida';
  end if;

  -- O preço não vem do navegador: sai do cardápio, aqui dentro.
  v_subtotal := public.price_order_items(p_items);
  if coalesce(p_customer ->> 'fulfillment', 'entrega') = 'retirada' then
    v_fee := 0;
  else
    v_fee := least(greatest(coalesce(p_delivery_fee, 0), 0), c_max_delivery_fee);
  end if;

  return query
  insert into public.orders (customer, items, subtotal, delivery_fee, total)
  values (p_customer, p_items, v_subtotal, v_fee, v_subtotal + v_fee)
  returning orders.id, orders.code, orders.created_at,
            orders.subtotal, orders.delivery_fee, orders.total;
end;
$fn$;

revoke all on function public.create_order(jsonb, jsonb, numeric, numeric) from public;
grant execute on function public.create_order(jsonb, jsonb, numeric, numeric) to anon, authenticated;
