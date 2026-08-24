-- =============================================================================
-- Açaiteria MR: correções de segurança.
--
-- Roda inteiro no SQL Editor do Supabase, de uma vez só. É idempotente: pode
-- rodar de novo sem estragar nada.
--
-- Resolve três coisas que deixavam o banco aberto:
--
--   1. "Entrou, pode tudo". As policies do painel liberavam qualquer conta
--      autenticada. Com o cadastro público ligado no projeto, qualquer pessoa
--      criava uma conta e passava a ler nome, telefone e endereço de todos os
--      clientes da loja.
--
--   2. O total do pedido vinha pronto do navegador. Quem chamasse a função
--      direto gravava um pedido de R$ 200 com total de R$ 0,01.
--
--   3. Pedido e avaliação entravam sem limite de tamanho, e a avaliação sem
--      limite nenhum de conteúdo.
--
-- IMPORTANTE: isto é defesa em profundidade, não substitui desligar o cadastro
-- público em Authentication > Sign In / Providers > Allow new users to sign up.
-- =============================================================================

-- =============================================================================
-- 1. Quem é a loja
--
-- Estar autenticado deixa de ser suficiente: a conta precisa estar nesta
-- lista. Contas criadas depois não entram sozinhas, e é isso que fecha a porta
-- do cadastro público — deny by default.
-- =============================================================================

create table if not exists public.store_staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  created_at timestamptz not null default now()
);

alter table public.store_staff enable row level security;

-- A lista só é visível para quem já está nela. Ninguém de fora descobre quem
-- opera a loja, e ninguém se adiciona: escrita só pelo painel do Supabase.
drop policy if exists "equipe se enxerga" on public.store_staff;
create policy "equipe se enxerga" on public.store_staff
  for select to authenticated using (user_id = auth.uid());

-- As contas que já existem hoje são as da loja: continuam funcionando sem que
-- ninguém precise refazer login. Só o que nascer depois fica de fora.
insert into public.store_staff (user_id, email)
select id, coalesce(email, '') from auth.users
on conflict (user_id) do nothing;

create or replace function public.is_store_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (select 1 from public.store_staff where user_id = auth.uid());
$fn$;

revoke all on function public.is_store_staff() from public;
grant execute on function public.is_store_staff() to authenticated;

-- =============================================================================
-- 2. Policies: trocar "está autenticado" por "é da loja"
--
-- A leitura pública do cardápio e dos depoimentos publicados não muda: é o que
-- o site precisa mostrar para quem nunca fez login.
-- =============================================================================

do $pol$
declare
  t text;
begin
  foreach t in array array[
    'products', 'product_sizes', 'product_bases', 'topping_categories', 'toppings'
  ]
  loop
    execute format('drop policy if exists "cardapio escrita da loja" on public.%I', t);
    execute format(
      'create policy "cardapio escrita da loja" on public.%I for all to authenticated '
      || 'using (public.is_store_staff()) with check (public.is_store_staff())',
      t
    );
  end loop;

  foreach t in array array[
    'orders', 'reviews', 'inventory_items', 'inventory_movements', 'finance_entries'
  ]
  loop
    execute format('drop policy if exists "pedidos da loja" on public.%I', t);
    execute format('drop policy if exists "avaliacoes da loja" on public.%I', t);
    execute format('drop policy if exists "somente a loja" on public.%I', t);
    execute format(
      'create policy "somente a loja" on public.%I for all to authenticated '
      || 'using (public.is_store_staff()) with check (public.is_store_staff())',
      t
    );
  end loop;
end;
$pol$;

-- =============================================================================
-- 3. Avaliação enviada pelo site: limites e conteúdo
--
-- Continua aberta a quem não fez login (é o cliente avaliando), mas com teto
-- de tamanho e sem poder publicar a si mesma. NOT VALID de propósito: as
-- constraints valem para o que entrar de agora em diante e não travam a
-- migration por causa de uma linha antiga fora do formato.
-- =============================================================================

alter table public.reviews drop constraint if exists reviews_texto_no_limite;
alter table public.reviews add constraint reviews_texto_no_limite check (
  length(comment) <= 1000
  and length(customer_name) <= 80
  and length(district) <= 80
  and (order_code is null or length(order_code) <= 20)
) not valid;

drop policy if exists "avaliacao enviada pelo site" on public.reviews;
create policy "avaliacao enviada pelo site" on public.reviews
  for insert to anon, authenticated
  with check (published = false and length(comment) <= 1000 and length(customer_name) <= 80);

-- =============================================================================
-- 4. Pedido: o total passa a ser calculado no banco, de verdade
--
-- Antes a função somava dois números que o navegador mandava. Agora ela lê o
-- preço de cada tamanho, base e complemento direto do cardápio e refaz a conta
-- inteira, repetindo a mesma regra de cota grátis por categoria que o site
-- mostra na tela (site/src/lib/builder.ts).
--
-- O que o navegador manda vira apenas intenção: quais itens, em que ordem.
-- Preço nenhum vindo do cliente é aproveitado.
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
  v_free integer;
  v_max integer;
  -- Quantos complementos já entraram em cada categoria, por id.
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

      select free_count, max_count into v_free, v_max
        from public.topping_categories where id = v_top.category_id;

      v_count := coalesce((v_used ->> v_top.category_id::text)::integer, 0) + 1;
      if v_max is not null and v_count > v_max then
        raise exception 'Complementos acima do limite da categoria';
      end if;
      v_used := jsonb_set(v_used, array[v_top.category_id::text], to_jsonb(v_count));

      -- Passou da cota grátis e tem preço: entra como adicional. Item de preço
      -- zero nunca cobra, mesmo fora da cota.
      if v_count > v_free and v_top.price > 0 then
        v_unit := v_unit + v_top.price;
      end if;
    end loop;

    v_subtotal := v_subtotal + v_unit * v_quantity;
  end loop;

  return v_subtotal;
end;
$fn$;

revoke all on function public.price_order_items(jsonb) from public;

-- O retorno passa a trazer os valores calculados aqui. Sem isso o site
-- mostraria na tela, e mandaria no WhatsApp, a conta que ele mesmo fez — que é
-- justamente a que deixou de valer.
--
-- p_subtotal continua na assinatura, e ignorado, só para o site publicado hoje
-- não quebrar entre rodar esta migration e sair o próximo deploy.
create or replace function public.create_order(
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
  v_subtotal numeric;
  v_fee numeric;
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

  -- O preço não vem do navegador: sai do cardápio, aqui dentro.
  v_subtotal := public.price_order_items(p_items);
  v_fee := least(greatest(coalesce(p_delivery_fee, 0), 0), c_max_delivery_fee);

  return query
  insert into public.orders (customer, items, subtotal, delivery_fee, total)
  values (p_customer, p_items, v_subtotal, v_fee, v_subtotal + v_fee)
  returning orders.id, orders.code, orders.created_at,
            orders.subtotal, orders.delivery_fee, orders.total;
end;
$fn$;

revoke all on function public.create_order(jsonb, jsonb, numeric, numeric) from public;
grant execute on function public.create_order(jsonb, jsonb, numeric, numeric) to anon, authenticated;
