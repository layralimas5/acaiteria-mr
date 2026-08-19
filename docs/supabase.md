# Supabase: como ligar o banco

Tudo que é da loja (pedidos, cardápio, avaliações, estoque e caixa) mora no
Supabase. Sem essas chaves configuradas, o site abre mas não carrega cardápio
nem grava pedido.

São cinco passos, uma vez só.

## 1. Criar o projeto

1. Entre em [supabase.com](https://supabase.com) e crie um projeto
2. Região: **South America (São Paulo)**, que é a mais perto
3. Guarde a senha do banco que ele pedir (não é a senha do painel da loja)

O plano gratuito atende com folga o volume de uma açaiteria.

## 2. Rodar o SQL

1. No projeto, abra **SQL Editor**
2. Rode os arquivos de `supabase/migrations/` **em ordem de número**, um de
   cada vez: cole o conteúdo inteiro e clique em **Run**
   - `0001_init.sql`: tabelas, índices, funções e as regras de segurança
   - `0002_create_order.sql`: a função que cria pedido pelo site

Isso cria as tabelas, os índices, as funções e as regras de segurança (RLS).
O banco nasce **vazio**: nenhum produto, nenhum preço. Quem cadastra o
cardápio é a loja, pelo painel.

## 3. Criar o usuário da loja

1. **Authentication > Users > Add user**
2. E-mail e senha da loja, com **Auto Confirm User** ligado

Esse é o login de `/sistema`. Para trocar a senha depois, é nessa mesma tela.

Recomendado, para ninguém criar conta sozinho: em **Authentication >
Sign In / Providers**, desligue **Allow new users to sign up**.

## 4. Configurar as chaves

Em **Project Settings > API**, copie a **Project URL** e a chave **anon
public**.

No computador (desenvolvimento):

```bash
cd site
cp .env.example .env
```

Preencha o `.env`:

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

No Netlify (produção): **Site configuration > Environment variables**, as duas
mesmas variáveis. Depois, um novo deploy para elas entrarem no build.

> A chave `anon` é pública e vai no navegador, isso é esperado. Quem protege os
> dados é o RLS do banco. A chave `service_role` **nunca** entra no projeto.

## 5. Cadastrar o cardápio

Abra `/sistema`, entre com o usuário criado e vá em **Cardápio**:

1. **Novo produto** (Açaí), depois abra ele e cadastre os **tamanhos** com preço
2. Cadastre as **bases** (tradicional, zero, cupuaçu)
3. **Nova categoria** de complemento (Frutas), com quantos vêm grátis
4. Dentro dela, os **complementos** com o preço do adicional

Assim que existir um produto com pelo menos um tamanho e uma base, o montador
do site sai do aviso de "cardápio em montagem" e passa a vender.

## Quem pode o quê

A segurança está no banco, não na tela. Mesmo que alguém descubra a chave
`anon`, o RLS só permite:

| Quem | Pode |
| --- | --- |
| Visitante do site | Ler o cardápio, ler os depoimentos publicados, criar o próprio pedido, enviar a própria avaliação, confirmar o recebimento pelo número do pedido |
| Visitante do site | **Não** consegue ler pedido nenhum, nem o próprio, nem ver estoque ou caixa |
| Loja (logada) | Tudo |

O visitante nunca escreve direto na tabela de pedidos. Ele tem duas funções, e
só isso:

- `create_order` grava o pedido e devolve apenas o número dele. O total é
  calculado no banco, então não dá para forjar preço pelo navegador
- `confirm_order` carimba a hora do recebimento e devolve só sim ou não

## Backup

O Supabase faz backup diário automático no plano gratuito. Para uma cópia na
mão: **Database > Backups**, ou exportar as tabelas em CSV pelo Table Editor.

## Quando o site avisa que o banco não respondeu

Se aparecer "Banco não configurado" ou erro de conexão:

1. Confira se o `.env` existe e está preenchido (e reinicie o `npm run dev`, que só lê o arquivo na inicialização)
2. No Netlify, confira as variáveis de ambiente e refaça o deploy
3. No Supabase, veja se o projeto não está pausado (acontece com projeto gratuito sem uso por semanas)
