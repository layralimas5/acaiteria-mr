-- =============================================================================
-- Açaiteria MR: complementos da garrafa de açaí.
--
-- Roda inteiro no SQL Editor do Supabase, de uma vez só, DEPOIS da migration
-- 0014 e do `garrafas.sql`. É idempotente: rodar de novo não duplica nada, só
-- acerta preço e vínculo.
--
-- Isto é CADASTRO, não estrutura: faz pelo SQL o mesmo que a loja faria no
-- painel. Cria a categoria "Complementos da garrafa", marcada só na garrafa, e
-- tira da garrafa as categorias do copo (frutas, cremes, caldas e o resto).
-- Depois disso, complemento novo da garrafa entra por essa categoria no painel.
--
-- Itens e preços passados pela loja em 14/10/2026. Sem preço é cortesia.
-- =============================================================================

do $seed$
declare
  c_category constant text := 'Complementos da garrafa';
  v_product uuid;
  v_category uuid;
begin
  select id into v_product from public.products where lower(trim(name)) = 'garrafa de açaí';
  if v_product is null then
    raise exception 'Garrafa de açaí não cadastrada: rode o garrafas.sql antes';
  end if;

  -- Categoria -------------------------------------------------------------
  select id into v_category from public.topping_categories
   where lower(trim(title)) = lower(c_category);

  if v_category is null then
    insert into public.topping_categories (title, subtitle, free_count, max_count, sort_order)
    values (
      c_category,
      'Pra misturar na garrafa.',
      0,
      null,
      (select coalesce(max(sort_order), -1) + 1 from public.topping_categories)
    )
    returning id into v_category;
  end if;

  -- Complementos ----------------------------------------------------------
  insert into public.toppings (category_id, name, price, emoji, sort_order)
  select v_category, nome, preco, emoji, posicao
    from (values
      ('Paçoca',                0.00, '🥜', 0),
      ('Leite em pó',           0.00, '🥛', 1),
      ('Leite condensado',      0.00, '🥛', 2),
      ('Cobertura de chocolate', 0.00, '🍫', 3),
      ('Cobertura de morango',  0.00, '🍓', 4),
      ('Amendoim',              0.00, '🥜', 5),
      ('Avelã',                 3.00, '🌰', 6),
      ('Chocolate cremoso',     0.00, '🍫', 7),
      ('Creme de ninho',        2.00, '🥛', 8)
    ) as itens (nome, preco, emoji, posicao)
   where not exists (
     select 1 from public.toppings
      where category_id = v_category and lower(trim(name)) = lower(itens.nome)
   );

  update public.toppings
     set price = case lower(trim(name))
                   when 'avelã' then 3.00
                   when 'creme de ninho' then 2.00
                   else 0.00
                 end
   where category_id = v_category;

  -- Vínculo: a garrafa leva só essa categoria, e essa categoria só a garrafa.
  delete from public.product_topping_categories
   where (product_id = v_product and category_id <> v_category)
      or (category_id = v_category and product_id <> v_product);

  insert into public.product_topping_categories (product_id, category_id)
  values (v_product, v_category)
  on conflict do nothing;

  update public.products set accepts_toppings = true
   where id = v_product and not accepts_toppings;
end;
$seed$;

-- Confere o que entrou.
select p.name as produto,
       c.title as categoria,
       t.name as complemento,
       t.price as preco
  from public.product_topping_categories l
  join public.products p on p.id = l.product_id
  join public.topping_categories c on c.id = l.category_id
  join public.toppings t on t.category_id = c.id
 where lower(trim(p.name)) = 'garrafa de açaí'
 order by t.sort_order;
