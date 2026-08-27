-- =============================================================================
-- Açaiteria MR: complemento com preço nunca sai de graça.
--
-- Roda inteiro no SQL Editor do Supabase, de uma vez só. É idempotente.
--
-- O problema: a cota grátis da categoria valia por ordem de escolha. Em
-- "Cremes" a cota é 1 e convivem Avelã e Leitinho (preço zero) com Nutella e
-- Bueno (R$ 3,00). Quem clicava na Nutella primeiro levava os R$ 3,00 de
-- graça; quem clicava na Avelã primeiro pagava. Dois clientes, o mesmo copo,
-- preços diferentes, e a loja perdendo a margem justamente no complemento mais
-- caro.
--
-- A regra nova: quem decide é o preço do cardápio, não a ordem do clique.
-- Preço zero é cortesia, preço é adicional. A cota (`free_count`) segue como o
-- número de cortesias anunciado e `max_count` segue limitando a escolha, mas
-- nenhum dos dois muda mais o valor.
--
-- Precisa existir aqui e não só no site: desde a 0003 é esta função que fecha
-- a conta do pedido. Mudar só a tela faria o cliente ver R$ 3,00 e pagar zero.
-- Espelha site/src/lib/builder.ts.
-- =============================================================================

create or replace function public.price_order_items(p_items jsonb)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_item jsonb;
  v_topping jsonb;
  v_subtotal numeric := 0;
  v_unit numeric;
  v_quantity integer;
  v_size public.product_sizes;
  v_base public.product_bases;
  v_top public.toppings;
  v_max integer;
  -- Quantos complementos já entraram em cada categoria, por id. Serve só para
  -- o teto: o preço não depende mais de contagem.
  v_used jsonb;
  v_count integer;
begin
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := coalesce((v_item ->> 'quantity')::integer, 0);
    if v_quantity < 1 or v_quantity > 50 then
      raise exception 'Quantidade invalida no pedido';
    end if;

    select * into v_size from public.product_sizes
     where id = (v_item -> 'size' ->> 'id')::uuid and available;
    if not found then
      raise exception 'Tamanho indisponivel no pedido';
    end if;

    select * into v_base from public.product_bases
     where id = (v_item -> 'base' ->> 'id')::uuid and available
       and product_id = v_size.product_id;
    if not found then
      raise exception 'Base indisponivel no pedido';
    end if;

    v_unit := v_size.base_price + v_base.extra_price;
    v_used := '{}'::jsonb;

    for v_topping in select * from jsonb_array_elements(coalesce(v_item -> 'toppings', '[]'::jsonb))
    loop
      select * into v_top from public.toppings
       where id = (v_topping ->> 'id')::uuid and available;
      if not found then
        raise exception 'Complemento indisponivel no pedido';
      end if;

      select max_count into v_max
        from public.topping_categories where id = v_top.category_id;

      v_count := coalesce((v_used ->> v_top.category_id::text)::integer, 0) + 1;
      if v_max is not null and v_count > v_max then
        raise exception 'Complementos acima do limite da categoria';
      end if;
      v_used := jsonb_set(v_used, array[v_top.category_id::text], to_jsonb(v_count));

      -- Tem preço no cardápio: cobra, em qualquer posição da escolha.
      if v_top.price > 0 then
        v_unit := v_unit + v_top.price;
      end if;
    end loop;

    v_subtotal := v_subtotal + v_unit * v_quantity;
  end loop;

  return v_subtotal;
end;
$fn$;

revoke all on function public.price_order_items(jsonb) from public;
