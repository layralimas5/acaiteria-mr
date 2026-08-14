# Sistema da loja

Painel onde a Açaiteria MR acompanha os pedidos feitos no site e dá baixa.

## Como acessar

- Endereço: **`/sistema`** (ex.: `acaiteriamr.com.br/sistema`)
- Atalho: ícone de monitor no menu do site
- Senha padrão: `mr2026` — trocar definindo `VITE_ADMIN_PASSWORD` no ambiente
  de build (Netlify/Vercel → variáveis de ambiente)

## O que o painel mostra

- **Resumo do dia**: pedidos, quantos estão em aberto e faturamento
- **Filtros por status**: em aberto, novos, preparando, em entrega, concluídos, cancelados
- **Cartão de cada pedido**: número, horário, cliente, itens com complementos,
  endereço com referência, telefone, forma de pagamento (e troco), observações e total

## Fluxo de trabalho

Cada pedido anda por quatro estados, um clique de cada vez:

`Novo → Preparando → Saiu para entrega → Concluído` (o botão final é **Dar baixa**)

Também dá para **Cancelar** um pedido em andamento e **Arquivar** os já
concluídos ou cancelados, tirando-os da tela.

O botão **WhatsApp** abre a conversa direto com o telefone do cliente.

## Como o pedido chega

1. O cliente monta no site e clica em **Fechar pedido**
2. Preenche nome, WhatsApp, endereço, pagamento e observações
3. Ao enviar: o pedido é gravado no sistema com um número (ex.: `#1401`) **e**
   o WhatsApp da loja abre com a mensagem completa do pedido

Ou seja, a loja recebe pelos dois caminhos: a mensagem chega no WhatsApp e o
pedido fica registrado no painel para dar baixa.

## Limitação importante (leia antes de publicar)

Os pedidos são gravados **no navegador** (localStorage), não num servidor.
Na prática isso significa:

- O painel enxerga os pedidos feitos **no mesmo aparelho e navegador**
- Pedido feito no celular do cliente **não aparece** no computador da loja
- Hoje o que garante que a loja receba tudo é a **mensagem no WhatsApp**

Para o painel funcionar de verdade com pedidos de qualquer cliente, é preciso
um banco. O código já está preparado: toda a leitura e escrita passa por
`src/orders/store.ts`, e nenhuma tela conhece o armazenamento.

## Migrar para o Supabase (quando quiser)

1. Criar projeto no Supabase e a tabela:

```sql
create table orders (
  id text primary key,
  code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'novo',
  customer jsonb not null,
  items jsonb not null,
  total numeric(10,2) not null
);

alter table orders enable row level security;

-- Qualquer visitante pode criar o próprio pedido.
create policy "clientes criam pedidos" on orders for insert with check (true);

-- Só a equipe autenticada lê e atualiza.
create policy "equipe le" on orders for select using (auth.role() = 'authenticated');
create policy "equipe atualiza" on orders for update using (auth.role() = 'authenticated');
```

2. `npm i @supabase/supabase-js` e configurar `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY`
3. Reescrever as funções de `src/orders/store.ts` (`listOrders`, `createOrder`,
   `updateOrderStatus`, `removeOrder`, `subscribeToOrders`) usando o client —
   `subscribeToOrders` vira Realtime, e o painel passa a atualizar sozinho em
   qualquer aparelho
4. Trocar a senha do painel por Supabase Auth (login por e-mail da equipe)

Nenhum componente precisa ser alterado nesse processo.
