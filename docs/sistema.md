# Sistema da loja

Painel onde a Açaiteria MR acompanha os pedidos feitos no site e dá baixa.

## Como acessar

- Endereço: **`/sistema`** (ex.: `acaiteriamr.com.br/sistema`)
- Atalho: ícone de monitor no menu do site
- **Exige login** (e-mail e senha). O usuário é criado no painel do Supabase,
  em Authentication. Sem entrar, o banco não devolve nenhum dado da loja
- Sair fica no menu da conta, no canto superior direito

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

### Estoque e Cardápio: coisas diferentes

São duas abas, de propósito:

- **Estoque** é a despensa: o que a loja compra para produzir (polpa, granola, copo, colher). Nada disso aparece para o cliente
- **Cardápio** é a vitrine: o que o cliente vê no montador (produtos, tamanhos, bases, complementos)

Um item pode existir no cardápio e o insumo dele estar zerado: são controles
separados, e é assim mesmo. Quando faltar polpa, desliga o produto no
Cardápio; o Estoque registra o que faltou.

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

### Cardápio

É aqui que nasce tudo que o cliente monta no site. **Nada vem de fábrica**: o
sistema começa vazio e a loja cadastra o que vende.

A tela tem dois blocos:

**Produtos** (Açaí, Sorvete, o que for). Cada produto tem:

- Nome, emoji e descrição
- Como chamar a escolha: no açaí é "Base", no sorvete costuma ser "Sabor"
- **Tamanhos**, com nome, medida, preço, etiqueta ("Mais pedido") e foto
- **Bases ou sabores**, com nome, descrição e acréscimo de preço

**Complementos**, organizados em categorias (frutas, cremes, crocantes,
caldas). A categoria é quem carrega a regra:

- **Quantos vêm grátis** já inclusos no preço do copo
- **Máximo por copo**, opcional (é como se limita caldas a 2, por exemplo)

Cada item tem chave de disponibilidade, setas para reordenar, lápis para
editar e lixeira para apagar. **O que for salvo vale no site na hora**, sem
publicar nada.

Regras que valem a pena saber:

- Produto sem nenhum tamanho não aparece no site: sem tamanho não há preço
- Apagar um produto apaga os tamanhos e as bases dele; apagar uma categoria apaga os complementos dela
- Desligar é diferente de apagar: desligado some do site e volta com um clique, apagado some do cadastro
- Pedido antigo nunca muda. A montagem inteira fica congelada no pedido, então mexer no preço hoje não reescreve o que foi vendido ontem

O código fica em `src/catalog/` (`api.ts` fala com o banco, `useCatalog.ts` é
o cache que site e painel compartilham) e a tela em `src/admin/menu/`.

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
como aparecer sozinhos, por isso a ficha.

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

### Confirmação de recebimento e depoimento

A mensagem de **Concluído** vai com o link `acaiteriamr.com.br/?pedido=1000`.
O cliente toca, cai no site no card "Chegou tudo certo?" e, ao confirmar, a
loja recebe a confirmação no WhatsApp e o cliente é levado direto para a seção
de depoimentos, com o formulário de avaliação aberto.

O passo a passo completo, os custos de automatizar o envio e a recomendação
estão em `whatsapp-automatico.md`.

**Por que ainda tem um clique:** mensagem disparada sozinha precisa de uma API
de WhatsApp, que ou custa por mês ou tira o número do celular da loja. O
`whatsapp-automatico.md` compara os caminhos e explica a recomendação.

## Como o pedido chega

1. O cliente monta no site e clica em **Fechar pedido**
2. Preenche nome, WhatsApp, endereço, pagamento e observações
3. Ao enviar: o pedido é gravado no sistema com um número (ex.: `#1401`) **e**
   o WhatsApp da loja abre com a mensagem completa do pedido

Ou seja, a loja recebe pelos dois caminhos: a mensagem chega no WhatsApp e o
pedido fica registrado no painel para dar baixa.

## Onde os dados moram

Tudo que é da loja vive no **Supabase**: pedidos, cardápio, avaliações,
estoque e caixa. Na prática:

- Pedido feito no celular do cliente aparece no computador da loja **na hora**, sem recarregar a página (Realtime)
- O painel abre igual em qualquer aparelho, bastando entrar com e-mail e senha
- O cardápio que a loja edita é o mesmo que todo cliente vê

O passo a passo de criar o projeto, rodar o SQL e configurar as chaves está em
`supabase.md`.

Continua no navegador, de propósito, só o que é do próprio visitante: o
carrinho em montagem, o último pedido feito daquele aparelho (para oferecer
"pedir de novo") e a preferência de avisar o cliente ao mudar a etapa.
