# Açaiteria MR

Site institucional + vitrine de cardápio com pedido por iFood e WhatsApp.

## Stack

React 19 + TypeScript (strict) + Vite 7 + Tailwind CSS 4 + Framer Motion.

## Rodar

```bash
cd site
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
npm run preview  # serve o dist/
```

## Onde mexer

| O que mudar | Arquivo |
| --- | --- |
| Telefone, endereço, horário, link do iFood | `site/src/config/business.ts` |
| Taxa de entrega e valor do frete grátis | `site/src/config/business.ts` (`delivery.fee`, `delivery.freeShippingFrom`) |
| Formas de pagamento aceitas e chave Pix | `site/src/config/business.ts` (`payments`) |
| Modo só delivery | `site/src/config/business.ts` (`deliveryOnly`) |
| Produtos, preços, categorias, complementos | `site/src/data/products.ts` |
| Regras de link de pedido (iFood vs WhatsApp) | `site/src/lib/order.ts` |
| Cores e tipografia | `site/src/index.css` (bloco `@theme`) |

Nenhum componente tem telefone, preço ou link hardcoded. Tudo vem desses arquivos.

## Número do pedido

Sequencial e sem reinício, começando em **#1000**: o próximo é #1001, e assim
por diante. Quem numera é o banco, pela sequência `order_code_seq`, não a
quantidade de pedidos guardados: apagar um pedido antigo no painel não faz dois
nascerem com o mesmo número. Todo pedido enviado pelo site entra no painel, em
Pedidos, na hora, em qualquer aparelho.

## Sistema da loja

O painel fica em **`/sistema`** (ícone de monitor no menu) e **exige login**:
a loja acompanha os pedidos, cadastra o cardápio, controla estoque e caixa. O
usuário é criado no Supabase, em Authentication.

Detalhes e fluxo de status em `docs/sistema.md`. Como ligar o banco, em
`docs/supabase.md`.

## Comportamento do botão de pedido

`business.delivery.ifoodUrl` vazio → todos os CTAs apontam pro WhatsApp com a
mensagem já preenchida com o produto. Assim que o link do iFood for colado
nessa variável, os mesmos botões passam a apontar pro iFood automaticamente,
e o botão de WhatsApp continua disponível na seção de entrega.

## Pendências antes de publicar

- [x] Telefone real: (27) 99285-3101
- [ ] Resto dos dados em `business.ts` (endereço, horário, Instagram)
- [ ] Confirmar taxa de entrega com o cliente (hoje `delivery.fee: 5`) e a chave Pix (`payments.pixKey`)
- [ ] Criar o projeto no Supabase e rodar `supabase/migrations/0001_init.sql` (`docs/supabase.md`)
- [ ] Cadastrar o cardápio no painel: o sistema começa vazio, sem nenhum produto
- [ ] Publicar os primeiros depoimentos reais (painel → Avaliações → Publicar no site; a seção fica escondida até lá)
- [ ] Fotos dos demais produtos (só o pote 300ml tem foto; o resto usa a ilustração `AcaiCup.tsx`)
- [x] Logo oficial aplicada no menu, rodapé e favicon
- [x] Imagem de compartilhamento (`public/imagem/og.jpg`)
- [x] Deploy configurado no `netlify.toml` (ver seção abaixo)
- [ ] Domínio apontado
- [ ] Loja aberta no iFood e link colado em `business.ts` (ver `docs/ifood.md`)

## Deploy

O `netlify.toml` na raiz já traz tudo: é só conectar o repositório no Netlify e
publicar, sem configurar nada na interface.

O site fica em `site/`, não na raiz, então o arquivo define `base = "site"` e
`publish = "dist"`. Atenção nesse ponto: com `base` definido, o Netlify resolve
o `publish` a partir dele: escrever `site/dist` vira `site/site/dist` e o
deploy falha com *Deploy directory does not exist*. O Node está fixado na 22
porque o Vite 7 exige 20.19+ ou 22.12+.

O roteamento fica em `site/public/_redirects`: `/sistema` é resolvido no
navegador, então toda rota cai no `index.html`. Deixei fora do `netlify.toml`
de propósito, para a regra não existir em dois lugares.

Os assets levam hash no nome e recebem cache permanente; o HTML revalida
sempre, que é o que faz uma publicação nova aparecer na hora para o cliente.

## Imagens

Originais ficam em `assets-originais/` (fora do build). As versões que o site
usa são geradas por script:

```bash
cd site
npm run images
```

As fotos de produto (`product: true` no script) passam por
`scripts/normalize-product.mjs`, que mede o copo dentro da foto e reenquadra
todas na mesma escala, e o produto sempre ocupa ~82% da altura. Isso resolve o
fato de cada foto vir do estúdio com um zoom diferente.

Isso produz `public/imagem/`: fotos de produto em WebP 900px (com o fundo roxo do estúdio, exibidas em quadro `object-cover`), logo em WebP
256px, ícone PNG 192px e a imagem de compartilhamento `og.jpg` (1200x630).
Para adicionar a foto de um novo produto, jogue o original em
`assets-originais/`, registre em `scripts/optimize-images.mjs` e aponte o campo
`image` do produto em `src/data/products.ts`.

## Imagem do banner

As artes do banner ficam em `business.heroImages`, uma lista: cada item tem
`src` (versão grande, a partir de 768px), `srcSmall` (versão leve do celular) e
`alt`. Lista vazia deixa o banner só com o roxo da marca.

Com duas ou mais artes o banner entra em **rodízio**, trocando a cada
`business.heroRotationMs` (hoje 5000 ms) com uma dissolvência. As bolinhas
abaixo do texto mostram em qual arte está e permitem trocar na mão. Quem usa
`prefers-reduced-motion` não vê o rodízio: fica na primeira arte.

Para somar uma arte nova: original em `assets-originais/`, registre as duas
larguras em `scripts/optimize-images.mjs`, rode `npm run images` e acrescente o
item em `heroImages`. Só entram aqui artes panorâmicas com o terço esquerdo
livre, porque o texto do banner fica por cima.

## Galeria da marca

`src/components/BrandGallery.tsx`, logo depois da seção de entrega
(`#a-marca`). O banner ocupa a largura inteira da tela, sem margem nem canto
arredondado, e o texto da seção vive dentro dele: o rótulo "A marca", o título,
a linha de apoio e o botão de pedido ficam numa faixa de gradiente no rodapé do
quadro. As artes se revezam a cada
`business.heroRotationMs` com dissolvência e bolinhas de controle. As imagens
saem de `business.gallery` (mesmo formato de `heroImages`); lista vazia esconde
a seção. É o lugar certo para arte que não tem espaço livre para texto.

Cada arte traz `headline` (que é o `<h2>` da seção) e `subline`. Os dois trocam
junto com a arte. A faixa é um gradiente, então o texto lê bem sobre qualquer
ilustração e nada cobre os personagens. Sem `headline`, a arte fica limpa.

A seção de entrega (`Delivery.tsx`) segue a mesma ideia: o roxo vai de ponta a
ponta, sem cartão nem borda, e só o conteúdo respeita o container de 6xl.

O rodízio do banner e o da galeria usam o mesmo hook,
`src/hooks/useRotation.ts`, que também é quem respeita `prefers-reduced-motion`.

## Depoimentos e avaliação

`src/components/Testimonials.tsx` (`#depoimentos`), abaixo da galeria. Os
depoimentos vêm do banco: são as avaliações que o cliente autorizou e a loja
marcou como publicadas no painel. A média das notas é calculada, não digitada.
Enquanto não houver nenhuma publicada, a seção não aparece: só entra ali
depoimento real e autorizado.

Quem alimenta essa lista é o convite de avaliação
(`src/components/ReviewInvite.tsx`), que aparece para quem já pediu daqui:

1. A loja dá baixa no pedido como concluído. A mensagem de "entregue" que o
   painel abre no WhatsApp leva o link `siteUrl/?pedido=1000`
2. O cliente abre o link e vê o card **"Chegou tudo certo?"**. Ao confirmar, a
   loja recebe o aviso no WhatsApp, o pedido é carimbado como recebido no
   painel e o cliente cai na seção de depoimentos com o formulário aberto
3. Se ele voltar ao site por conta própria, o convite aparece sozinho depois do
   tempo médio de entrega mais 30 minutos
4. Ao enviar, a avaliação grava no banco e abre o WhatsApp da loja com a nota,
   o texto e a permissão escritos
5. No painel, em **Avaliações**, a loja vê a média, cada nota, o texto e se o
   cliente liberou a publicação. **Publicar no site é um clique**: o depoimento
   aparece na hora, sem republicar nada

Pedido avaliado ou dispensado não recebe o convite de novo
(`src/orders/review.ts`).

As avaliações ficam em `src/orders/reviews.ts`, com a mesma lógica dos pedidos:
uma porta de entrada só para os dados, e nenhuma tela conhece o banco.

No celular o escurecimento do banner acaba antes do rodapé da seção e o texto
fica no terço de cima, então a arte aparece limpa embaixo, sem o texto por
cima dela.

A arte é panorâmica com o produto à direita e espaço livre à esquerda, onde
entram os selos, o título e a descrição. O escurecimento é feito por gradiente:
horizontal no desktop (escuro à esquerda, limpo à direita) e vertical no
celular (escuro em cima, produto visível embaixo).

Medidas do banner na tela:

| Tela | Tamanho |
| --- | --- |
| Desktop grande (1920px) | 1920x843 |
| Desktop (1440px) | 1440x843 |
| Tablet | 768x~600 |
| Celular | 390x~520 |

Arte recomendada: **1830x860 px** (proporção ~2,1:1), com o produto à direita e
o terço esquerdo livre. Coloque em `assets-originais/`, registre em
`scripts/optimize-images.mjs` e rode `npm run images`.

## Vitrine dos copos

Antes do montador, `src/components/CupsShowcase.tsx` apresenta as fotos dos
tamanhos com preço e cota grátis. O botão "Montar esse" leva direto ao
montador já com produto e tamanho preenchidos, abrindo na etapa da base.
A vitrine lê os mesmos dados de `productKinds`, então tamanho novo com foto
aparece nela sozinho.

## Monte seu Açaí (configurador + carrinho)

Configurador de produto em etapas na própria página, com preço em tempo real.

**Onde mexer:**

**Todo o cardápio é cadastrado pela loja**, no painel, em Cardápio. Nada de
produto, preço ou complemento vive no código.

| O que | Onde |
| --- | --- |
| Produtos, tamanhos, bases e sabores | Painel → Cardápio → Produtos |
| Categorias de complemento, cota grátis e limite | Painel → Cardápio → Complementos |
| Complementos: nome, preço, emoji, foto, disponibilidade | Painel → Cardápio → dentro da categoria |
| Como o cardápio chega na tela | `src/catalog/api.ts` e `src/catalog/useCatalog.ts` |
| Estrutura das tabelas | `supabase/migrations/0001_init.sql` |
| Regra de preço (o que é grátis, o que é cobrado) | `src/lib/builder.ts` |
| Carrinho (agrupamento, quantidade, persistência) | `src/cart/CartContext.tsx` |

Para marcar algo como esgotado, é a chave de disponibilidade no painel: o card
aparece desabilitado no site, com o aviso, e volta com outro clique.

**Regra dos gratuitos:** a cota é **por categoria**, não por copo. Cada
categoria tem `free` (quantos já vêm inclusos) e `max` (teto de escolha; `null`
quando não há limite). Dentro de uma categoria vale a ordem de escolha: os
primeiros entram na cota, os seguintes somam o próprio preço. Ao bater o teto,
os cards restantes daquela categoria ficam desabilitados com o aviso "no
limite".

Esses números são da categoria e a loja define ao criar cada uma, no painel,
em Cardápio. Mudar vale na hora, sem publicar o site de novo.

**Observação por item:** a última etapa do montador tem um campo livre
("alguma observação?", até 200 caracteres). Ele vai junto do item, então dois
copos iguais com recados diferentes são itens diferentes no carrinho. A
observação aparece no carrinho, na mensagem do WhatsApp e no cartão do pedido
dentro do painel.

**Onde o pedido vive:** não existe gaveta lateral nem seção separada. O pedido
mora no próprio painel do montador: terminada a etapa 5, a mesma caixa troca de
conteúdo e vira a sacola (`src/components/builder/OrderPanel.tsx`), com lista,
pagamento e confirmação. O botão "Quer adicionar mais um pedido?" devolve o
cliente à etapa 1 antes do pagamento. Enquanto o painel está no pedido, a
trilha de etapas, o resumo lateral e a barra do celular saem da tela.

Quem chega pelo ícone do menu, pelo CTA flutuante ou pelo "pedir de novo" cai
na mesma caixa já aberta na sacola: o `App` incrementa `cartRequest` e o
montador troca de visão. É o fluxo do iFood: uma tela só, que muda de papel
conforme a etapa.

**Pedir de novo:** ao enviar um pedido, ele fica salvo no navegador do cliente
(`src/orders/lastOrder.ts`). Na volta, `src/components/RepeatOrder.tsx` mostra
um cartão logo abaixo do banner com o pedido anterior e o botão "Pedir de
novo", e o checkout já vem com nome, telefone e endereço preenchidos. Os itens
nunca voltam pelo preço salvo: `src/lib/repeatOrder.ts` remonta cada um contra
o catálogo de hoje, recalcula o preço e avisa o que saiu de linha ou esgotou.

**Carrinho:** montagens diferentes são itens diferentes; montagens idênticas
somam quantidade. O pedido persiste em `localStorage` e é finalizado pelo
WhatsApp com a lista detalhada, que é o canal de venda atual (ver `docs/ifood.md`).

**Entrega e pagamento no fechamento:** o carrinho mostra itens, taxa de entrega
e total antes do checkout. A taxa vem de `business.delivery.fee` e zera sozinha
quando o subtotal alcança `freeShippingFrom`. A regra vive em
`src/lib/order.ts` (`deliveryFee`), nunca dentro de componente. O checkout está
dividido em Seus dados, Entrega, Pagamento e Observações. As formas aceitas
saem de `business.payments`: Pix sempre, cartão na entrega enquanto
`cardOnDelivery` for true, dinheiro (com campo de troco) enquanto `cash` for
true. Com `pixKey` preenchida, a chave aparece ao escolher Pix. O pedido salvo
guarda `subtotal`, `deliveryFee` e `total`, e o painel mostra a divisão no
cartão do pedido.

**Visual:** a seção é clara; no card lateral "Seu pedido" (`OrderSummary`) só
a faixa do topo, com o total, é roxa. No celular os cards são mais compactos
(complementos em três colunas, fotos e textos menores) para caber mais na tela
sem rolagem.

**Componentes:** `builder/AcaiBuilder` (orquestra), `SizeSelector`,
`BaseSelector`, `ToppingCategory`, `ToppingCard`, `OrderSummary` (sticky no
desktop), `MobileOrderBar` (barra fixa no celular), `StepSection` (etapa com
marca de concluído) e `CartDrawer` (painel do pedido).
