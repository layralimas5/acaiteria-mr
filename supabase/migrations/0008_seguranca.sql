-- =============================================================================
-- Açaiteria MR: fechar o que ficou aberto.
--
-- Roda inteiro no SQL Editor do Supabase, de uma vez só. É idempotente.
--
-- Três buracos, todos do mesmo tipo: porta que aceita quem não deveria.
--
--   1. As fotos do cardápio. A 0006 liberou o bucket para "authenticated", e
--      desde a 0003 estar autenticado não quer dizer nada: com o cadastro
--      público ligado, qualquer pessoa cria conta. Dava para trocar e apagar
--      as fotos do site publicado. Agora vale a mesma régua das tabelas: só
--      quem está em `store_staff`.
--
--   2. Pedido sem limite de frequência. Fazer pedido não exige login, de
--      propósito, mas um script conseguia despejar centenas deles: a cozinha
--      recebe, a impressora imprime e a loja para. Passa a existir um teto por
--      telefone e um teto geral por minuto, alto o bastante para o movimento
--      real de uma açaiteria e baixo o bastante para matar o flood.
--
--   3. Avaliação sem limite de frequência, pelo mesmo motivo.
--
-- Nada aqui muda o que a loja e o cliente fazem no dia a dia.
-- =============================================================================

-- =============================================================================
-- 1. Fotos do cardápio: só a equipe envia, troca e apaga
--
-- A leitura continua pública: é foto de produto, aparece no site para quem
-- nunca fez login.
-- =============================================================================

drop policy if exists "cardapio foto enviada pela loja" on storage.objects;
create policy "cardapio foto enviada pela loja" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'cardapio' and public.is_store_staff());

drop policy if exists "cardapio foto trocada pela loja" on storage.objects;
create policy "cardapio foto trocada pela loja" on storage.objects
  for update to authenticated
  using (bucket_id = 'cardapio' and public.is_store_staff())
  with check (bucket_id = 'cardapio' and public.is_store_staff());

drop policy if exists "cardapio foto apagada pela loja" on storage.objects;
create policy "cardapio foto apagada pela loja" on storage.objects
  for delete to authenticated
  using (bucket_id = 'cardapio' and public.is_store_staff());

-- =============================================================================
-- 2. Pedido: teto de frequência
--
-- Os números saem do movimento real: uma açaiteria de bairro não passa de
-- alguns pedidos por minuto, e o mesmo telefone não pede quatro vezes em dois
-- minutos sem ser engano ou ataque. Quem esbarrar no limite lê um aviso e
-- tenta de novo, em vez de o pedido sumir em silêncio.
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

-- =============================================================================
-- 3. Avaliação: teto de frequência
--
-- A contagem mora numa função `security definer` de propósito: contar dentro
-- da própria policy faria o Postgres reaplicar a policy na subconsulta e a
-- inserção morreria em recursão infinita.
-- =============================================================================

create or replace function public.reviews_no_ultimo_minuto()
returns integer
language sql
stable
security definer
set search_path = public
as $fn$
  select count(*)::integer from public.reviews where created_at > now() - interval '1 minute';
$fn$;

revoke all on function public.reviews_no_ultimo_minuto() from public;
grant execute on function public.reviews_no_ultimo_minuto() to anon, authenticated;

drop policy if exists "avaliacao enviada pelo site" on public.reviews;
create policy "avaliacao enviada pelo site" on public.reviews
  for insert to anon, authenticated
  with check (
    published = false
    and length(comment) <= 1000
    and length(customer_name) <= 80
    and public.reviews_no_ultimo_minuto() < 10
  );
