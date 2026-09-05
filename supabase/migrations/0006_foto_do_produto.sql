-- =============================================================================
-- Açaiteria MR: foto do produto e envio de imagem pelo painel.
--
-- Roda inteiro no SQL Editor do Supabase, de uma vez só. É idempotente.
--
-- Antes, produto só tinha emoji: para pôr a foto de um Sundae no card de
-- escolha era preciso publicar o arquivo na pasta do site e colar o caminho na
-- mão, ou seja, dependia de desenvolvedor. Agora o produto tem foto própria e
-- o painel envia o arquivo direto para o Storage, que devolve uma URL pública.
--
-- Vale para produto, tamanho e complemento: os três guardam uma URL em `image`
-- e passam a aceitar tanto o caminho local antigo ("/imagem/pote-500ml.webp")
-- quanto a URL do bucket.
-- =============================================================================

alter table public.products add column if not exists image text;

-- Bucket público do cardápio: qualquer visitante vê a foto no site, só a loja
-- logada envia ou apaga arquivo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cardapio',
  'cardapio',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

drop policy if exists "cardapio foto leitura publica" on storage.objects;
create policy "cardapio foto leitura publica" on storage.objects
  for select using (bucket_id = 'cardapio');

drop policy if exists "cardapio foto enviada pela loja" on storage.objects;
create policy "cardapio foto enviada pela loja" on storage.objects
  for insert to authenticated with check (bucket_id = 'cardapio');

drop policy if exists "cardapio foto trocada pela loja" on storage.objects;
create policy "cardapio foto trocada pela loja" on storage.objects
  for update to authenticated using (bucket_id = 'cardapio') with check (bucket_id = 'cardapio');

drop policy if exists "cardapio foto apagada pela loja" on storage.objects;
create policy "cardapio foto apagada pela loja" on storage.objects
  for delete to authenticated using (bucket_id = 'cardapio');
