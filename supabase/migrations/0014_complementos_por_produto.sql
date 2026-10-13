-- =============================================================================
-- Açaiteria MR: cada categoria de complemento diz em quais produtos vale.
--
-- Roda inteiro no SQL Editor do Supabase, de uma vez só. É idempotente.
--
-- Até aqui o produto que leva complemento recebia todas as categorias da loja.
-- A garrafa mudou isso: ela tem complementos próprios, que só existem nela, e
-- não leva fruta nem o resto do que vai no copo.
--
-- O vínculo é por categoria, não por complemento: a cota grátis e o teto já
-- são da categoria, e marcar dezenas de itens produto por produto não se
-- sustenta no dia a dia da loja. Complemento exclusivo da garrafa vira uma
-- categoria marcada só nela.
--
-- Nada muda no que já está no ar: todo produto existente nasce ligado a toda
-- categoria existente. Produto ou categoria nova também entra ligada a tudo
-- (é o comportamento de antes), e a loja desmarca no painel o que não vale.
--
-- `accepts_toppings` continua sendo a chave geral do produto: desligada, ele
-- não leva complemento nenhum, marcado ou não.
--
-- Precisa existir aqui e não só no site: é `price_order_items` que fecha a
-- conta do pedido. Espelha site/src/lib/builder.ts.
-- =============================================================================

create table if not exists public.product_topping_categories (
  product_id uuid not null references public.products (id) on delete cascade,
  category_id uuid not null references public.topping_categories (id) on delete cascade,
  primary key (product_id, category_id)
);

create index if not exists product_topping_categories_category_idx
  on public.product_topping_categories (category_id);

alter table public.product_topping_categories enable row level security;

drop policy if exists "cardapio leitura publica" on public.product_topping_categories;
create policy "cardapio leitura publica" on public.product_topping_categories
  for select using (true);

drop policy if exists "cardapio escrita da loja" on public.product_topping_categories;
create policy "cardapio escrita da loja" on public.product_topping_categories
  for all to authenticated
  using (public.is_store_staff()) with check (public.is_store_staff());

-- Tudo ligado a tudo, como era antes desta migration.
insert into public.product_topping_categories (product_id, category_id)
select p.id, c.id
  from public.products p
 cross join public.topping_categories c
on conflict do nothing;

-- =============================================================================
-- Cadastro novo nasce ligado a tudo
-- =============================================================================

create or replace function public.link_new_product_to_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into public.product_topping_categories (product_id, category_id)
  select new.id, c.id from public.topping_categories c
  on conflict do nothing;
  return new;
end;
$fn$;

create or replace function public.link_new_category_to_products()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into public.product_topping_categories (product_id, category_id)
  select p.id, new.id from public.products p
  on conflict do nothing;
  return new;
end;
$fn$;

revoke all on function public.link_new_product_to_categories() from public;
revoke all on function public.link_new_category_to_products() from public;

drop trigger if exists products_link_categories on public.products;
create trigger products_link_categories
  after insert on public.products
  for each row execute function public.link_new_product_to_categories();

drop trigger if exists topping_categories_link_products on public.topping_categories;
create trigger topping_categories_link_products
  after insert on public.topping_categories
  for each row execute function public.link_new_category_to_products();

-- =============================================================================
-- Conta do pedido: complemento de categoria que não vale no produto é recusado
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
  v_accepts boolean;
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

    select accepts_toppings into v_accepts
      from public.products where id = v_size.product_id;

    v_unit := v_size.base_price + v_base.extra_price;
    v_used := '{}'::jsonb;

    for v_topping in select * from jsonb_array_elements(coalesce(v_item -> 'toppings', '[]'::jsonb))
    loop
      if not coalesce(v_accepts, true) then
        raise exception 'Esse produto nao leva complemento';
      end if;

      select * into v_top from public.toppings
       where id = (v_topping ->> 'id')::uuid and available;
      if not found then
        raise exception 'Complemento indisponivel no pedido';
      end if;

      if not exists (
        select 1 from public.product_topping_categories
         where product_id = v_size.product_id and category_id = v_top.category_id
      ) then
        raise exception 'Complemento nao vale para esse produto';
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
