-- =============================================================================
-- Açaiteria MR: abrir e fechar os pedidos na mão, pelo painel.
--
-- Roda inteiro no SQL Editor do Supabase, de uma vez só. É idempotente.
--
-- O horário (18:30 às 23:00) continua mandando no dia a dia. Só que num
-- sábado fraco a loja quis seguir depois das 23:00 e não tinha como: o site
-- fechava sozinho e a trava do banco recusava. Agora existe uma linha em
-- `store_status` com a decisão da equipe:
--
--   mode = 'auto'    vale o horário, sem intervenção (padrão)
--   mode = 'open'    recebendo pedido fora do horário, até `until`
--   mode = 'closed'  fechou antes da hora, até `until`
--
-- `until` é quando a decisão caduca e o horário volta a mandar. O painel
-- preenche: fechou mais cedo, caduca na próxima abertura; seguiu aberta,
-- caduca de manhã (limite em `site/src/config/business.ts`).
--
-- Qualquer visitante lê a linha (o site precisa saber se mostra o montador) e
-- recebe a mudança em tempo real. Só a equipe escreve. E a `create_order`
-- passa a perguntar a `store_is_open()`, que junta horário e decisão: o que o
-- site mostra e o que o banco aceita saem da mesma conta.
--
-- O horário fica na `store_is_open()`, espelhando `business.hours`. Mudou o
-- horário da loja, muda nos dois.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. A decisão da equipe: uma linha só
-- -----------------------------------------------------------------------------

create table if not exists public.store_status (
  -- Chave fixa em true: a tabela nunca tem mais de uma linha.
  id boolean primary key default true check (id),
  mode text not null default 'auto' check (mode in ('auto', 'open', 'closed')),
  until timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.store_status (id) values (true)
on conflict (id) do nothing;

drop trigger if exists store_status_touch on public.store_status;
create trigger store_status_touch
  before update on public.store_status
  for each row execute function public.touch_updated_at();

alter table public.store_status enable row level security;

drop policy if exists "status lido pelo site" on public.store_status;
create policy "status lido pelo site" on public.store_status
  for select using (true);

drop policy if exists "status mudado pela loja" on public.store_status;
create policy "status mudado pela loja" on public.store_status
  for update to authenticated
  using (public.is_store_staff())
  with check (public.is_store_staff());

-- Tempo real: o site fecha o montador na hora em que o painel fechar.
do $rt$
begin
  alter publication supabase_realtime add table public.store_status;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$rt$;

-- -----------------------------------------------------------------------------
-- 2. Aberto agora? Horário mais decisão, no fuso da loja
-- -----------------------------------------------------------------------------

create or replace function public.store_is_open()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  -- Horário de atendimento, espelhando `site/src/config/business.ts`.
  --
  -- Cada faixa traz os dias da semana no padrão do Postgres (0 = domingo) e a
  -- hora de abrir e fechar. Mudar o horário da loja é mudar nos dois lugares:
  -- aqui e no `business.ts`. O site decide o que mostrar; esta função decide o
  -- que entra, e é ela que vale.
  c_hours constant jsonb := '[
    {"days": [1, 2, 3, 5, 6], "opens": "18:30", "closes": "23:00"}
  ]';
  -- Folga no fechamento. Quem apertou "enviar" às 22:59 e chegou aqui às 23:00
  -- não perde o pedido por causa do relógio; o site já parou de aceitar.
  c_tolerancia constant interval := interval '5 minutes';
  v_mode text;
  v_until timestamptz;
  v_agora timestamp;
  v_dia integer;
  v_hora time;
  v_fecha time;
  v_faixa jsonb;
begin
  -- A decisão da equipe vem primeiro. Vencida, conta como 'auto'.
  select mode, until into v_mode, v_until
    from public.store_status
   where id = true;

  if v_mode in ('open', 'closed') and (v_until is null or v_until > now()) then
    return v_mode = 'open';
  end if;

  -- Fuso da loja, não o do servidor nem o do navegador: um cliente com o
  -- relógio do celular em outro fuso não compra fora do expediente.
  v_agora := now() at time zone 'America/Sao_Paulo';
  v_dia := extract(dow from v_agora);
  v_hora := v_agora::time;

  for v_faixa in select * from jsonb_array_elements(c_hours)
  loop
    -- A folga não pode virar o dia: fechamento perto da meia-noite mais cinco
    -- minutos daria 00:0x, e a comparação passaria a recusar a noite inteira.
    v_fecha := (v_faixa ->> 'closes')::time + c_tolerancia;
    if v_fecha < (v_faixa ->> 'closes')::time then
      v_fecha := time '23:59:59';
    end if;

    if v_faixa -> 'days' @> to_jsonb(v_dia)
       and v_hora >= (v_faixa ->> 'opens')::time
       and v_hora < v_fecha then
      return true;
    end if;
  end loop;

  return false;
end;
$fn$;

revoke all on function public.store_is_open() from public;
grant execute on function public.store_is_open() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. create_order: a conferência de horário sai daqui e vai para store_is_open()
--
-- O resto da função é o que já valia na 0010, sem alteração.
-- -----------------------------------------------------------------------------

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

  if not public.store_is_open() then
    raise exception 'A loja esta fechada agora. O pedido so entra dentro do horario de atendimento.';
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
