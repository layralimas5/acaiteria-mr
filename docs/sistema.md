# Sistema da loja

Painel onde a Açaiteria MR acompanha os pedidos feitos no site e dá baixa.

## Como acessar

- Endereço: **`/sistema`** (ex.: `acaiteriamr.com.br/sistema`)
- Atalho: ícone de monitor no menu do site
- Sem senha por enquanto: quem abre o endereço entra direto. A autenticação
  de verdade entra junto com a migração dos pedidos para o banco

## O que o painel mostra

Barra lateral roxa (no celular ela vira topo compacto) com o resumo do dia e
cinco seções. No topo, à direita, o menu da conta: **Minha conta**,
**Configurações** e **Sair**.

### Dashboard

- Quatro indicadores: aguardando, processando, entregues e cancelados, cada um com quantidade e valor
- **Fila de pedidos**: tudo que está em aberto, do mais antigo para o mais novo, com o botão de baixa em cada linha
- Faturamento do período, dividido em recebido e a receber, mais ticket médio
- Divisão por forma de pagamento e a lista de **troco a separar**

O **filtro de período** (usado aqui e no financeiro) tem hoje, ontem, 7 dias,
30 dias, intervalo livre por datas e tudo. Embaixo dele fica escrito o
intervalo que está valendo. A fila de pedidos ignora o filtro de propósito:
o que está em aberto precisa sair, seja de quando for.

### Pedidos

A lista completa, empilhada por etapa (novos, preparando, em entrega,
concluídos, cancelados), cada bloco com a quantidade e o valor somado.

Ferramentas da página:

- **Busca** por número, cliente, telefone ou endereço. Ignora acento e aceita as palavras fora de ordem
- **Período**, começando em "tudo" de propósito: pedido em aberto de ontem não pode sumir da tela
- **Ordem**: mais antigos primeiro (a fila justa, que é o padrão) ou mais recentes
- **Visualização**: cartões, com todos os detalhes, ou lista compacta para quando o movimento aperta. Clicar numa linha da lista volta para os cartões com aquele pedido destacado

Cada pedido em aberto mostra **há quanto tempo está esperando**, contando desde
que entrou. O relógio fica neutro no começo, vira âmbar perto do tempo médio de
entrega e vermelho quando passa dele (`business.delivery.averageMinutes`), e
atualiza sozinho a cada 30 segundos.

O cartão traz número, horário, cliente, a trilha das quatro etapas, itens com
complementos, endereço com referência, telefone, forma de pagamento (e troco),
observações e total.

A página vive em `src/admin/OrdersView.tsx`.

### Entregas

O que está pronto para sair e o que já está na rua, com endereço, referência,
troco a levar, link para o mapa e para o WhatsApp do cliente. Mostra também
quanto o entregador tem a receber na mão (tudo que não é Pix).

### Estoque e Site: coisas diferentes

São duas abas, de propósito:

- **Estoque** é a despensa: o que a loja compra para produzir (polpa, granola, copo, colher). Nada disso aparece para o cliente
- **Site** é a vitrine: o que o cliente vê no montador (produtos, tamanhos, bases, complementos)

Um item pode existir no cardápio e o insumo dele estar zerado — são controles
separados, e é assim mesmo. Quando faltar polpa, tira o produto do ar na aba
Site; o Estoque registra o que faltou.

### Estoque

Cada insumo tem categoria, unidade (kg, g, L, ml, un, caixa, pacote),
quantidade atual e **mínimo de segurança**. Ao bater no mínimo, o item entra no
bloco vermelho **Repor agora**, ganha etiqueta na lista e o menu lateral mostra
o contador.

O botão **Movimentar** abre a ficha de entrada ou saída:

- **Entrada** (compra, devolução, ajuste) soma ao saldo. Se você informar quanto custou, ela pode **lançar a compra como saída no caixa**, categoria Insumos, sem digitar de novo no financeiro
- **Saída** (produção, perda, vencimento, ajuste) subtrai, e é bloqueada quando passa do que existe: nesse caso o certo é corrigir por ajuste de contagem

Toda movimentação fica no histórico, com data, motivo, quantidade e custo.
Quem está começando pode clicar em **lista pronta de açaiteria** e já nascer com
os insumos típicos cadastrados.

O controle fica em `src/inventory/store.ts`.

### Site

Lista o cardápio inteiro (produtos, tamanhos, bases e complementos) com uma
chave em cada item. **O que for desligado sai do site na hora**, sem
republicar nada, e volta pelo botão **Repor esgotados**.

O botão **Adicionar item** abre a ficha de cadastro e cria complemento,
tamanho ou base/sabor direto pelo painel. O item nasce publicado, aparece no
montador na hora e pode ser escondido pela chave ou excluído pela lixeira.
Itens criados assim levam a etiqueta *criado aqui*.

Três arquivos sustentam isso:

- `src/stock/store.ts` — o que está esgotado
- `src/stock/custom.ts` — os itens criados no painel
- `src/stock/useCatalog.ts` — junta cardápio publicado + criados − esgotados, e é o que o montador lê

O cardápio publicado continua em `src/data/builder.ts`. Item de lá só sai de
verdade com deploy; item criado no painel vive só no navegador da loja.

### Financeiro

Junta as vendas do site com o caixa da loja:

- **Entradas** (vendas entregues + lançamentos de entrada), **saídas**, **resultado** e **a receber**
- **Caixa**: ficha de lançamento com tipo (entrada ou saída), descrição, valor, data e categoria. Ao salvar, os totais atualizam na hora, e a lista permite excluir
- Divisão por forma de pagamento, vendas dia a dia e a tabela dos últimos pedidos

O caixa fica em `src/finance/store.ts`. As contas de pedido ficam em
`src/admin/metrics.ts`, usadas também pelo dashboard para os números nunca
divergirem.

**Por que existe o caixa manual:** o sistema só enxerga o que passou pelo
site. Compra de insumo, aluguel, venda no balcão e retirada de sócio não têm
como aparecer sozinhos — por isso a ficha.

## Fluxo de trabalho

Cada pedido anda por quatro estados, um clique de cada vez:

`Novo → Preparando → Saiu para entrega → Concluído` (o botão final é **Dar baixa**)

Também dá para **Cancelar** um pedido em andamento e **Arquivar** os já
concluídos ou cancelados, tirando-os da tela.

## Aviso de status para o cliente

A cada mudança de status o painel abre o WhatsApp do cliente com a mensagem
pronta daquele momento ("já está sendo preparado", "saiu para entrega"…). Isso
é controlado pela chave **Avisar o cliente ao dar baixa no pedido**, em
**Configurações** (no menu da conta); desligada, o aviso só sai quando alguém
clicar em **Avisar cliente** no cartão do pedido.

Os textos ficam em `src/orders/messages.ts`.

**Por que não é automático:** notificação que chega sozinha (push no celular ou
mensagem disparada pelo sistema) precisa de servidor — o site é estático e não
tem de onde disparar. Com o Supabase no lugar, dá para: (a) push web de
verdade, (b) mensagem automática via API oficial do WhatsApp (Meta Cloud API,
que cobra por conversa) e (c) uma página de acompanhamento onde o cliente vê o
status atualizar sozinho, que costuma ser o melhor custo-benefício.

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
4. Colocar login de verdade com Supabase Auth (e-mail da equipe) e ligar o
   **Sair** do menu da conta ao encerramento da sessão
5. Site, caixa e estoque seguem o mesmo caminho: `src/stock/store.ts`,
   `src/stock/custom.ts`, `src/finance/store.ts` e `src/inventory/store.ts`
   viram tabelas, e o que a loja marca passa a valer para todos os clientes,
   não só para o navegador dela

Nenhum componente precisa ser alterado nesse processo.
