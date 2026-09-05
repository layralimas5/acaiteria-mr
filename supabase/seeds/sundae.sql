-- =============================================================================
-- Açaiteria MR: cadastro do Sundae.
--
-- Roda inteiro no SQL Editor do Supabase, de uma vez só. É idempotente: rodar
-- de novo não duplica nada, só atualiza o que já existe.
--
-- Isto é CADASTRO, não estrutura: faz pelo SQL o mesmo que a loja faria no
-- painel, em Cardápio > Novo produto. Depois de rodar, o Sundae aparece no
-- montador e ganha card na vitrine "Nossos copos" do site, sem publicar nada.
--
-- A foto: o tamanho aponta para `/imagem/sundae.webp`, que nasce de
-- `assets-originais/sundae.png` pelo `npm run images`. Se preferir mandar a
-- foto pelo painel (Cardápio > Sundae > tamanho > lápis > Enviar foto), ela
-- substitui esse caminho e o arquivo local deixa de ser necessário.
-- =============================================================================

do $seed$
declare
  v_product uuid;
begin
  -- Produto ---------------------------------------------------------------
  select id into v_product from public.products where lower(trim(name)) = 'sundae';

  if v_product is null then
    insert into public.products (
      name, description, emoji, image,
      base_step_title, base_step_subtitle, base_label,
      sort_order
    )
    values (
      'Sundae',
      'A taça pequena, pra matar a vontade sem pesar.',
      '🍨',
      null,
      'Escolha seu sabor',
      'Um por taça.',
      'Sabor',
      (select coalesce(max(sort_order), -1) + 1 from public.products)
    )
    returning id into v_product;
  end if;

  -- Tamanho: a taça única, com o preço ------------------------------------
  -- `volume` fica vazio de propósito: o sundae não se mede em mililitros, e o
  -- card do site já usa o nome quando não há medida.
  insert into public.product_sizes (product_id, name, volume, base_price, image, sort_order)
  select v_product, 'Sundae', '', 6.50, '/imagem/sundae.webp', 0
  where not exists (
    select 1 from public.product_sizes
     where product_id = v_product and lower(trim(name)) = 'sundae'
  );

  update public.product_sizes
     set base_price = 6.50
   where product_id = v_product
     and lower(trim(name)) = 'sundae'
     and base_price is distinct from 6.50;

  -- Sabores ---------------------------------------------------------------
  insert into public.product_bases (product_id, name, description, extra_price, sort_order)
  select v_product, nome, descricao, 0, posicao
    from (values
      ('Açaí com Ninho', 'O açaí cremoso com leite Ninho por cima.', 0),
      ('Morango', 'Morango de verdade, doce na medida.', 1)
    ) as sabores (nome, descricao, posicao)
   where not exists (
     select 1 from public.product_bases
      where product_id = v_product and lower(trim(name)) = lower(trim(sabores.nome))
   );
end;
$seed$;

-- Confere o que entrou.
select p.name as produto,
       s.name as tamanho,
       s.base_price as preco,
       s.image as foto,
       (select string_agg(b.name, ', ' order by b.sort_order)
          from public.product_bases b where b.product_id = p.id) as sabores
  from public.products p
  left join public.product_sizes s on s.product_id = p.id
 where lower(trim(p.name)) = 'sundae';
