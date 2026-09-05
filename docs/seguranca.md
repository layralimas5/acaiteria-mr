# Segurança: como o site se protege e o que depende de você

O sistema não tem servidor próprio: o site é estático no **Netlify** e os dados
moram no **Supabase**. Não existe VPS, SSH, Docker, porta aberta nem firewall
para configurar — a única porta pública é o 443 do Netlify, que ele mesmo
gerencia com certificado renovado sozinho.

Isso muda onde fica a segurança. Não é no servidor: é **no banco**, nas regras
de quem pode ler e escrever cada linha (Row Level Security), e nas duas funções
de servidor do pagamento.

## As regras, em uma frase cada

- **Ninguém entra por padrão.** O banco nega tudo e libera só o que está
  escrito nas policies (`supabase/migrations/`).
- **O cardápio é público para ler.** Preço e foto aparecem para quem nunca fez
  login. Escrever, só a loja.
- **Pedido é gravado por qualquer visitante, mas nunca lido por ele.** Quem
  faz o pedido recebe de volta apenas o número. Nome, telefone e endereço dos
  outros clientes ficam com a loja.
- **O preço não vem do navegador.** A função `create_order` refaz a conta pelo
  cardápio. Alterar o total no navegador não muda o que é cobrado.
- **"Estar logado" não é ser da loja.** A conta precisa estar na tabela
  `store_staff`. Conta criada por fora entra e não vê nada, e o painel avisa
  que ela não tem acesso.
- **Pagamento não se carimba sozinho.** Quem marca "pago" é o webhook, depois
  de confirmar a cobrança na API da InfinitePay e conferir o valor.
- **A chave que ignora o banco inteiro (`service_role`) nunca vai ao
  navegador.** Ela só existe nas variáveis do Netlify.

## O que você precisa configurar (fora do código)

Marque conforme fizer. Sem esses itens, parte da proteção do código fica no
papel.

### Supabase

- [ ] **Desligar o cadastro público.** Authentication > Sign In / Providers >
      desmarcar **Allow new users to sign up**. É o que impede alguém de criar
      conta e passar a ser "autenticado".
- [ ] **Rodar as migrations pendentes**, na ordem, no SQL Editor:
      `0006_foto_do_produto.sql`, `0007_produto_sem_complementos.sql`,
      `0008_seguranca.sql`.
- [ ] **Conferir quem está em `store_staff`**: `select * from store_staff;`.
      Deve ter só as contas da loja. Tirar alguém é `delete from store_staff
      where email = '...';`.
- [ ] **Proteção de senha vazada**: Authentication > Policies > ativar
      **Leaked password protection** e exigir senha de pelo menos 10
      caracteres.
- [ ] **MFA na sua conta do Supabase** (a conta dona do projeto, não a da
      loja). É a chave do cofre inteiro.
- [ ] **Backup**: confirmar que o Point-in-Time Recovery ou o backup diário do
      plano está ligado.
- [ ] Nunca usar a chave `service_role` fora das variáveis do Netlify.

### Netlify

- [ ] **Variáveis de ambiente** (Site configuration > Environment variables):
      `INFINITEPAY_HANDLE`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
      `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. As três primeiras são do
      servidor e **não podem** levar o prefixo `VITE_`: tudo que começa com
      `VITE_` vai dentro do JavaScript que qualquer visitante baixa.
- [ ] **HTTPS forçado**: Domain management > HTTPS > **Force HTTPS** ligado.
- [ ] **MFA na sua conta do Netlify.**
- [ ] Se o domínio passar por Cloudflare um dia: SSL em **Full (strict)**,
      nunca **Flexible**.

### Rotação de chaves (só se houver suspeita de vazamento)

- [ ] Supabase > Project Settings > API > **Rotate** na `service_role`, e
      atualizar a variável no Netlify em seguida.
- [ ] Trocar a senha do painel em Authentication > Users.

## O que ainda é risco conhecido

- **O número do pedido é sequencial** (#1000, #1001). Quem tiver um número
  consegue ver se aquele pedido está pago e marcar que recebeu. Não expõe nome,
  telefone nem endereço de ninguém, e as funções devolvem uma palavra só. Para
  fechar de vez seria preciso um código aleatório por pedido, o que muda os
  links já enviados aos clientes.
- **Não há trilha de auditoria das ações da loja.** Apagar um produto ou um
  pedido não deixa registro de quem apagou. Faz sentido quando a loja tiver
  mais de uma pessoa com acesso.

## Se algo der errado

1. Desligar o cadastro público (se ainda estiver ligado).
2. Tirar as contas estranhas de `store_staff` e apagá-las em Authentication >
   Users.
3. Rotacionar a `service_role` e atualizar no Netlify.
4. Trocar a senha do painel.
5. Conferir os pedidos e as fotos do cardápio: é o que uma conta invasora
   conseguiria alterar.
