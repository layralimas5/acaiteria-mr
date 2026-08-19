-- =============================================================================
-- Cardápio inicial da Açaiteria MR.
--
-- Isto NÃO é uma migration: é um atalho para não cadastrar item por item no
-- painel na primeira vez. Roda uma vez, no SQL Editor, e depois a loja edita
-- tudo pelo painel, em Cardápio.
--
-- >>> CONFIRA OS PREÇOS ANTES DE RODAR <<<
--
-- Os valores abaixo vieram do protótipo do site. Os do açaí foram conversados
-- com a loja; os do SORVETE e as cotas de cremes e crocantes eram chute do
-- desenvolvimento, para a tela ter o que mostrar. Ajuste os números aqui ou
-- depois, no painel.
--
-- Rodar de novo não duplica: a limpeza no começo apaga o cardápio anterior.
-- Cuidado, então: rodar isto DEPOIS de a loja ter editado o cardápio joga as
-- edições fora. Pedidos antigos não são afetados, porque cada pedido guarda a
-- própria montagem.
-- =============================================================================

begin;

-- Cardápio do zero. As tabelas filhas somem por cascata.
delete from public.toppings;
delete from public.topping_categories;
delete from public.product_sizes;
delete from public.product_bases;
delete from public.products;

-- =============================================================================
-- Açaí
-- =============================================================================

with produto as (
  insert into public.products
    (name, description, emoji, base_step_title, base_step_subtitle, base_label, sort_order)
  values
    ('Açaí', 'Cremoso, batido na hora, montado do seu jeito.', '🍇',
     'Escolha sua base', 'Uma base por copo.', 'Base', 0)
  returning id
),
tamanhos as (
  insert into public.product_sizes
    (product_id, name, volume, base_price, image, highlight, sort_order)
  select produto.id, dados.name, dados.volume, dados.price, dados.image, dados.highlight, dados.ord
  from produto,
    (values
      ('Açaí 300ml', '300ml', 12.90, '/imagem/poto-300ml.webp', null, 0),
      ('Açaí 500ml', '500ml', 17.90, '/imagem/pote-500ml.webp', 'Mais pedido', 1),
      ('Açaí 700ml', '700ml', 22.90, '/imagem/copo-700ml.webp', null, 2)
    ) as dados(name, volume, price, image, highlight, ord)
  returning 1
)
insert into public.product_bases (product_id, name, description, extra_price, sort_order)
select produto.id, dados.name, dados.descricao, dados.extra, dados.ord
from produto,
  (values
    ('Açaí tradicional', 'O clássico, cremoso e adoçado na medida.', 0.00, 0),
    ('Açaí zero', 'Sem açúcar adicionado, mesma cremosidade.', 0.00, 1),
    ('Cupuaçu', 'Mais leve e cítrico, pra quem quer variar.', 2.00, 2),
    ('Açaí + Cupuaçu', 'Meio a meio no mesmo copo.', 2.00, 3)
  ) as dados(name, descricao, extra, ord);

-- =============================================================================
-- Sorvete
--
-- ATENÇÃO: tamanhos, preços e sabores nunca foram confirmados com a loja.
-- Se a Açaiteria não vende sorvete hoje, apague este bloco inteiro.
-- =============================================================================

with produto as (
  insert into public.products
    (name, description, emoji, base_step_title, base_step_subtitle, base_label, sort_order)
  values
    ('Sorvete', 'Bola, casquinha ou pote, com os mesmos complementos.', '🍦',
     'Escolha o sabor', 'Um sabor por pedido.', 'Sabor', 1)
  returning id
),
tamanhos as (
  insert into public.product_sizes (product_id, name, volume, base_price, sort_order)
  select produto.id, dados.name, dados.volume, dados.price, dados.ord
  from produto,
    (values
      ('Sorvete 1 bola', '1 bola', 8.90, 0),
      ('Sorvete 2 bolas', '2 bolas', 13.90, 1),
      ('Sorvete pote 500ml', 'Pote 500ml', 24.90, 2)
    ) as dados(name, volume, price, ord)
  returning 1
)
insert into public.product_bases (product_id, name, description, extra_price, sort_order)
select produto.id, dados.name, dados.descricao, dados.extra, dados.ord
from produto,
  (values
    ('Chocolate', 'O mais pedido da casa.', 0.00, 0),
    ('Morango', 'Feito com fruta.', 0.00, 1),
    ('Creme', 'Clássico, combina com tudo.', 0.00, 2),
    ('Flocos', 'Creme com raspas de chocolate.', 0.00, 3),
    ('Napolitano', 'Chocolate, morango e creme.', 1.00, 4)
  ) as dados(name, descricao, extra, ord);

-- =============================================================================
-- Complementos
--
-- free_count é quantos já vêm inclusos no preço do copo.
-- max_count é o teto de escolha; NULL quer dizer sem limite.
-- =============================================================================

with categoria as (
  insert into public.topping_categories (title, subtitle, free_count, max_count, sort_order)
  values ('Frutas', 'Fresquinhas, cortadas na hora', 3, null, 0)
  returning id
)
insert into public.toppings (category_id, name, price, emoji, sort_order)
select categoria.id, dados.name, dados.price, dados.emoji, dados.ord
from categoria,
  (values
    ('Morango', 3.00, '🍓', 0),
    ('Banana', 2.00, '🍌', 1),
    ('Kiwi', 3.50, '🥝', 2),
    ('Uva', 3.00, '🍇', 3)
  ) as dados(name, price, emoji, ord);

with categoria as (
  insert into public.topping_categories (title, subtitle, free_count, max_count, sort_order)
  values ('Cremes', 'Pra dar aquela camada extra', 1, null, 1)
  returning id
)
insert into public.toppings (category_id, name, price, emoji, sort_order)
select categoria.id, dados.name, dados.price, dados.emoji, dados.ord
from categoria,
  (values
    ('Creme de Ninho', 4.00, '🥛', 0),
    ('Nutella', 5.00, '🍫', 1),
    ('Doce de leite', 3.50, '🍯', 2),
    ('Creme de Ovomaltine', 4.50, '🥣', 3)
  ) as dados(name, price, emoji, ord);

with categoria as (
  insert into public.topping_categories (title, subtitle, free_count, max_count, sort_order)
  values ('Crocantes', 'O barulhinho da colherada', 2, null, 2)
  returning id
)
insert into public.toppings (category_id, name, price, emoji, sort_order)
select categoria.id, dados.name, dados.price, dados.emoji, dados.ord
from categoria,
  (values
    ('Granola', 2.00, '🌾', 0),
    ('Paçoca', 2.00, '🥜', 1),
    ('Ovomaltine', 3.00, '🍪', 2),
    ('Confete', 2.50, '🍬', 3)
  ) as dados(name, price, emoji, ord);

with categoria as (
  insert into public.topping_categories (title, subtitle, free_count, max_count, sort_order)
  values ('Caldas', 'Por cima de tudo', 2, 2, 3)
  returning id
)
insert into public.toppings (category_id, name, price, emoji, sort_order)
select categoria.id, dados.name, dados.price, dados.emoji, dados.ord
from categoria,
  (values
    ('Chocolate', 2.00, '🍫', 0),
    ('Leite condensado', 2.00, '🥛', 1),
    ('Morango', 2.00, '🍓', 2),
    ('Caramelo', 2.50, '🍮', 3)
  ) as dados(name, price, emoji, ord);

commit;
