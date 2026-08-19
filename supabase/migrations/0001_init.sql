-- =============================================================================
-- Açaiteria MR: estrutura inicial do banco.
--
-- Roda inteiro no SQL Editor do Supabase, de uma vez só.
--
-- O banco nasce VAZIO de propósito: nenhum produto, complemento ou preço vem
-- de fábrica. Quem cadastra o cardápio é a loja, pelo painel em /sistema.
-- =============================================================================

create extension if not exists pgcrypto;

-- Toda tabela com updated_at usa este gatilho.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

-- =============================================================================
-- Catálogo
-- =============================================================================

-- Produto é o tipo de coisa que a loja vende (açaí, sorvete, milk-shake).
-- Cada um tem os próprios tamanhos e as próprias bases ou sabores.
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  description text not null default '',
  emoji text not null default '',
  -- Títulos da etapa de base, que mudam de nome conforme o produto.
  base_step_title text not null default 'Escolha sua base',
  base_step_subtitle text not null default '',
  -- Como a base aparece no resumo do pedido ("Base", "Sabor").
  base_label text not null default 'Base',
  available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  volume text not null default '',
  base_price numeric(10, 2) not null check (base_price >= 0),
  image text,
  -- Etiqueta opcional no card, tipo "Mais pedido".
  highlight text,
  available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_sizes_product_idx on public.product_sizes (product_id, sort_order);

create table if not exists public.product_bases (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text not null default '',
  -- Acréscimo sobre o preço do tamanho. Zero na maioria das opções.
  extra_price numeric(10, 2) not null default 0 check (extra_price >= 0),
  available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_bases_product_idx on public.product_bases (product_id, sort_order);

-- Categoria de complemento (frutas, cremes, crocantes, caldas). A cota grátis
-- e o teto de escolha são da categoria, não do complemento.
create table if not exists public.topping_categories (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  subtitle text not null default '',
  -- Quantos já vêm inclusos no preço do copo.
  free_count integer not null default 0 check (free_count between 0 and 20),
  -- Teto de escolha. NULL quando não há limite.
  max_count integer check (max_count between 0 and 20),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  -- Teto abaixo da cota grátis seria uma regra impossível de cumprir.
  constraint topping_categories_free_within_max check (max_count is null or free_count <= max_count)
);

create table if not exists public.toppings (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.topping_categories (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  -- Preço do adicional, cobrado só depois que a cota grátis da categoria acaba.
  price numeric(10, 2) not null default 0 check (price >= 0),
  emoji text not null default '✨',
  image text,
  available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists toppings_category_idx on public.toppings (category_id, sort_order);

-- =============================================================================
-- Pedidos
-- =============================================================================

-- Número curto que a loja e o cliente usam. Sequencial e sem reinício:
-- apagar um pedido antigo não pode fazer dois nascerem com o mesmo número.
create sequence if not exists public.order_code_seq start 1000;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default nextval('public.order_code_seq')::text,
  status text not null default 'novo'
    check (status in ('novo', 'preparando', 'entrega', 'concluido', 'cancelado')),
  -- Nome, telefone, endereço, pagamento e observações, como vieram no checkout.
  customer jsonb not null,
  -- A montagem inteira de cada item, congelada no momento do pedido: mudar o
  -- preço de um complemento amanhã não pode alterar o pedido de ontem.
  items jsonb not null,
  subtotal numeric(10, 2) not null default 0,
  delivery_fee numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  -- Quando o cliente confirmou que recebeu, pelo link do WhatsApp.
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- =============================================================================
-- Avaliações
-- =============================================================================

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_code text,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  customer_name text not null default '',
  -- O cliente autorizou publicar no site.
  may_publish boolean not null default false,
  -- A loja publicou de fato. Só isso aparece na seção de depoimentos.
  published boolean not null default false,
  -- Bairro de quem escreveu, para dar contexto de entrega no depoimento.
  district text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists reviews_published_idx on public.reviews (published, created_at desc);

-- =============================================================================
-- Estoque interno (a despensa, nada disso aparece no site)
-- =============================================================================

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  category text not null default 'Outros',
  unit text not null default 'un' check (unit in ('kg', 'g', 'l', 'ml', 'un', 'cx', 'pct')),
  quantity numeric(12, 3) not null default 0 check (quantity >= 0),
  -- Abaixo disso o painel pede reposição.
  min_quantity numeric(12, 3) not null default 0 check (min_quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists inventory_items_touch_updated_at on public.inventory_items;
create trigger inventory_items_touch_updated_at
  before update on public.inventory_items
  for each row execute function public.touch_updated_at();

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items (id) on delete cascade,
  -- Guardado junto de propósito: o histórico continua legível se o nome do
  -- insumo mudar depois.
  item_name text not null,
  type text not null check (type in ('entrada', 'saida')),
  quantity numeric(12, 3) not null check (quantity > 0),
  unit text not null,
  reason text not null default '',
  -- Quanto custou a compra, quando for entrada paga.
  cost numeric(10, 2),
  created_at timestamptz not null default now()
);

create index if not exists inventory_movements_created_idx on public.inventory_movements (created_at desc);

-- Registra a movimentação e ajusta o saldo do insumo numa transação só, para
-- não existir movimentação sem saldo novo nem saldo novo sem movimentação.
create or replace function public.register_movement(
  p_item_id uuid,
  p_type text,
  p_quantity numeric,
  p_reason text,
  p_cost numeric default null
)
returns public.inventory_movements
language plpgsql
security invoker
as $fn$
declare
  v_item public.inventory_items;
  v_movement public.inventory_movements;
begin
  select * into v_item from public.inventory_items where id = p_item_id for update;
  if not found then
    raise exception 'Insumo % nao encontrado', p_item_id;
  end if;

  update public.inventory_items
     set quantity = greatest(
           0,
           quantity + case when p_type = 'entrada' then p_quantity else -p_quantity end
         )
   where id = p_item_id;

  insert into public.inventory_movements (item_id, item_name, type, quantity, unit, reason, cost)
  values (p_item_id, v_item.name, p_type, p_quantity, v_item.unit, coalesce(p_reason, ''), p_cost)
  returning * into v_movement;

  return v_movement;
end;
$fn$;

-- =============================================================================
-- Caixa
-- =============================================================================

create table if not exists public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  type text not null check (type in ('entrada', 'saida')),
  description text not null default '',
  category text not null default 'Outros',
  amount numeric(10, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create index if not exists finance_entries_date_idx on public.finance_entries (entry_date desc);

-- =============================================================================
-- Confirmação de recebimento pelo cliente
--
-- O cliente não pode enxergar nem alterar pedidos, que são dados de outras
-- pessoas. Esta função é a única brecha: com o número do pedido em mãos, ela
-- carimba a confirmação e devolve apenas sim ou não.
-- =============================================================================

create or replace function public.confirm_order(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_updated integer;
begin
  update public.orders
     set confirmed_at = now()
   where code = p_code
     and confirmed_at is null
     and status in ('entrega', 'concluido');

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$fn$;

revoke all on function public.confirm_order(text) from public;
grant execute on function public.confirm_order(text) to anon, authenticated;

-- =============================================================================
-- Row Level Security
--
-- Regra geral: o site (anon) lê o cardápio e os depoimentos publicados, e
-- escreve pedido e avaliação. Todo o resto é do painel, que exige login.
-- =============================================================================

alter table public.products enable row level security;
alter table public.product_sizes enable row level security;
alter table public.product_bases enable row level security;
alter table public.topping_categories enable row level security;
alter table public.toppings enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.finance_entries enable row level security;

-- Cardápio: qualquer um lê, só a loja escreve.
do $pol$
declare
  t text;
begin
  foreach t in array array['products', 'product_sizes', 'product_bases', 'topping_categories', 'toppings']
  loop
    execute format('drop policy if exists "cardapio leitura publica" on public.%I', t);
    execute format('create policy "cardapio leitura publica" on public.%I for select using (true)', t);

    execute format('drop policy if exists "cardapio escrita da loja" on public.%I', t);
    execute format(
      'create policy "cardapio escrita da loja" on public.%I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end;
$pol$;

-- Pedidos: o cliente cria o dele e nunca lê nenhum. A loja faz tudo.
drop policy if exists "pedido criado pelo site" on public.orders;
create policy "pedido criado pelo site" on public.orders
  for insert to anon, authenticated with check (true);

drop policy if exists "pedidos da loja" on public.orders;
create policy "pedidos da loja" on public.orders
  for all to authenticated using (true) with check (true);

-- Avaliações: o cliente envia a dele, o site mostra só o que a loja publicou.
drop policy if exists "avaliacao enviada pelo site" on public.reviews;
create policy "avaliacao enviada pelo site" on public.reviews
  for insert to anon, authenticated with check (published = false);

drop policy if exists "depoimentos publicados" on public.reviews;
create policy "depoimentos publicados" on public.reviews
  for select using (published = true);

drop policy if exists "avaliacoes da loja" on public.reviews;
create policy "avaliacoes da loja" on public.reviews
  for all to authenticated using (true) with check (true);

-- Estoque e caixa: só a loja, nem leitura pública.
do $pol$
declare
  t text;
begin
  foreach t in array array['inventory_items', 'inventory_movements', 'finance_entries']
  loop
    execute format('drop policy if exists "somente a loja" on public.%I', t);
    execute format(
      'create policy "somente a loja" on public.%I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end;
$pol$;

-- =============================================================================
-- Tempo real: o painel recebe pedido novo sem precisar recarregar.
-- =============================================================================

do $rt$
begin
  alter publication supabase_realtime add table public.orders;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$rt$;
