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
| Telefone, endereço, horário, link do iFood, frete grátis | `site/src/config/business.ts` |
| Data de inauguração e modo só delivery | `site/src/config/business.ts` (`launchDate`, `deliveryOnly`) |
| Produtos, preços, categorias, complementos | `site/src/data/products.ts` |
| Regras de link de pedido (iFood vs WhatsApp) | `site/src/lib/order.ts` |
| Cores e tipografia | `site/src/index.css` (bloco `@theme`) |

Nenhum componente tem telefone, preço ou link hardcoded. Tudo vem desses arquivos.

## Modo pré-inauguração

A loja inaugura em **05/09** e opera **só delivery**. Enquanto a data não
chega, o site entra sozinho em modo pré-lançamento: selo de inauguração com
contagem de dias no banner, CTAs virando "entrar na lista" (WhatsApp com
mensagem pronta) e a seção de endereço falando em área de entrega em vez de
convidar pra loja. No dia 05/09 tudo isso troca automaticamente para o modo
de pedido normal, sem precisar mexer no código: quem controla é `launchDate`.

`deliveryOnly: false` reativa os textos de loja física, se um dia abrir balcão.

## Comportamento do botão de pedido

`business.delivery.ifoodUrl` vazio → todos os CTAs apontam pro WhatsApp com a
mensagem já preenchida com o produto. Assim que o link do iFood for colado
nessa variável, os mesmos botões passam a apontar pro iFood automaticamente,
e o botão de WhatsApp continua disponível na seção de entrega.

## Pendências antes de publicar

- [ ] Dados reais em `business.ts` (telefone, endereço, horário, Instagram)
- [ ] Preços e cardápio confirmados com o cliente
- [ ] Fotos dos demais produtos (só o pote 300ml tem foto; o resto usa a ilustração `AcaiCup.tsx`)
- [x] Logo oficial aplicada no menu, rodapé e favicon
- [x] Imagem de compartilhamento (`public/imagem/og.jpg`)
- [ ] Domínio + deploy (Netlify ou Vercel, build `npm run build`, pasta `dist`)
- [ ] Loja aberta no iFood e link colado em `business.ts` — ver `docs/ifood.md`

## Imagens

Originais ficam em `assets-originais/` (fora do build). As versões que o site
usa são geradas por script:

```bash
cd site
npm run images
```

As fotos de produto (`product: true` no script) passam por
`scripts/normalize-product.mjs`, que mede o copo dentro da foto e reenquadra
todas na mesma escala — o produto sempre ocupa ~82% da altura. Isso resolve o
fato de cada foto vir do estúdio com um zoom diferente.

Isso produz `public/imagem/`: fotos de produto em WebP 900px (com o fundo roxo do estúdio, exibidas em quadro `object-cover`), logo em WebP
256px, ícone PNG 192px e a imagem de compartilhamento `og.jpg` (1200x630).
Para adicionar a foto de um novo produto, jogue o original em
`assets-originais/`, registre em `scripts/optimize-images.mjs` e aponte o campo
`image` do produto em `src/data/products.ts`.

## Imagem do banner

A arte de fundo do banner é definida em `business.heroImage`: `src` (versão
grande, a partir de 768px) e `srcSmall` (versão leve do celular). Com `src`
vazio, o banner fica só com o roxo da marca.

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

## Monte seu Açaí (configurador + carrinho)

Configurador de produto em etapas na própria página, com preço em tempo real.

**Onde mexer:**

| O que | Arquivo |
| --- | --- |
| Tamanhos, preço base, cota de complementos grátis, foto, disponibilidade | `src/data/builder.ts` → `cupSizes` |
| Bases (tradicional, zero, cupuaçu…) e acréscimo de cada uma | `src/data/builder.ts` → `acaiBases` |
| Complementos: nome, categoria, preço, emoji/foto, disponibilidade | `src/data/builder.ts` → `toppings` |
| Categorias e seus títulos | `src/data/builder.ts` → `toppingCategories` |
| Regra de preço (o que é grátis, o que é cobrado) | `src/lib/builder.ts` |
| Carrinho (agrupamento, quantidade, persistência) | `src/cart/CartContext.tsx` |

Nenhum preço vive dentro de componente: os dados são objetos puros e
serializáveis, prontos para virem de API ou painel administrativo sem alterar a
interface. Para marcar algo como esgotado, basta `available: false` — o card
aparece desabilitado com o aviso.

**Regra dos gratuitos:** os primeiros complementos escolhidos ocupam a cota do
tamanho (300ml = 3, 500ml = 5, 700ml = 7). A partir daí cada complemento soma
seu preço. A tela mostra "3 de 5 grátis" e, ao passar, "5 grátis + 2 adicionais".

**Carrinho:** montagens diferentes são itens diferentes; montagens idênticas
somam quantidade. O pedido persiste em `localStorage` e é finalizado pelo
WhatsApp com a lista detalhada, que é o canal de venda atual (ver `docs/ifood.md`).

**Componentes:** `builder/AcaiBuilder` (orquestra), `SizeSelector`,
`BaseSelector`, `ToppingCategory`, `ToppingCard`, `OrderSummary` (sticky no
desktop), `MobileOrderBar` (barra fixa no celular), `StepSection` (etapa com
marca de concluído) e `CartDrawer` (painel do pedido).
