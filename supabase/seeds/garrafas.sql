-- =============================================================================
-- Açaiteria MR: cadastro das garrafas de açaí (300ml e 500ml).
--
-- Roda inteiro no SQL Editor do Supabase, de uma vez só. É idempotente: rodar
-- de novo não duplica nada, só atualiza o preço.
--
-- Isto é CADASTRO, não estrutura: faz pelo SQL o mesmo que a loja faria no
-- painel, em Cardápio > Novo produto. Depois de rodar, a garrafa aparece no
-- montador e ganha card na vitrine "Nossos copos" do site, sem publicar nada.
--
-- A garrafa segue o mesmo passo a passo do copo, complementos incluídos, com a
-- mesma cota grátis das categorias (`accepts_toppings = true`).
--
-- As fotos apontam para `/imagem/garrafa-300ml.webp` e `garrafa-500ml.webp`,
-- que nascem de `assets-originais/garrafa-300ml.png` e `garrafa-500ml.png` pelo
-- `npm run images`. Sem a foto publicada, o card some da vitrine e a garrafa
-- segue à venda só no montador.
--
-- Preços confirmados com a loja em 13/10/2026 (constantes logo abaixo).
-- =============================================================================

do $seed$
declare
  c_price_300 constant numeric := 15.00;
  c_price_500 constant numeric := 18.00;
  v_product uuid;
begin
  if c_price_300 <= 0 or c_price_500 <= 0 then
    raise exception 'Preencha o preço das garrafas antes de rodar';
  end if;

  -- Produto ---------------------------------------------------------------
  select id into v_product from public.products where lower(trim(name)) = 'garrafa de açaí';

  if v_product is null then
    insert into public.products (
      name, description, emoji, image,
      base_step_title, base_step_subtitle, base_label,
      accepts_toppings, sort_order
    )
    values (
      'Garrafa de açaí',
      'Açaí batido na garrafa, pra beber gelado onde estiver.',
      '🥤',
      null,
      'Escolha seu sabor',
      'Um por garrafa.',
      'Sabor',
      true,
      (select coalesce(max(sort_order), -1) + 1 from public.products)
    )
    returning id into v_product;
  end if;

  update public.products set accepts_toppings = true
   where id = v_product and not accepts_toppings;

  -- Tamanhos --------------------------------------------------------------
  insert into public.product_sizes (product_id, name, volume, base_price, image, sort_order)
  select v_product, nome, volume, preco, foto, posicao
    from (values
      ('Garrafa 300ml', '300ml', c_price_300, '/imagem/garrafa-300ml.webp', 0),
      ('Garrafa 500ml', '500ml', c_price_500, '/imagem/garrafa-500ml.webp', 1)
    ) as tamanhos (nome, volume, preco, foto, posicao)
   where not exists (
     select 1 from public.product_sizes
      where product_id = v_product and lower(trim(name)) = lower(tamanhos.nome)
   );

  update public.product_sizes
     set base_price = case lower(trim(name))
                        when 'garrafa 300ml' then c_price_300
                        else c_price_500
                      end
   where product_id = v_product
     and lower(trim(name)) in ('garrafa 300ml', 'garrafa 500ml');

  -- Sabor -----------------------------------------------------------------
  -- Uma base só: o montador pede pelo menos uma para fechar a etapa 3.
  insert into public.product_bases (product_id, name, description, extra_price, sort_order)
  select v_product, 'Açaí tradicional', 'O açaí da casa, batido e gelado.', 0, 0
   where not exists (
     select 1 from public.product_bases
      where product_id = v_product and lower(trim(name)) = 'açaí tradicional'
   );
end;
$seed$;

-- Confere o que entrou.
select p.name as produto,
       p.accepts_toppings as leva_complemento,
       s.name as tamanho,
       s.base_price as preco,
       s.image as foto
  from public.products p
  left join public.product_sizes s on s.product_id = p.id
 where lower(trim(p.name)) = 'garrafa de açaí'
 order by s.sort_order;
