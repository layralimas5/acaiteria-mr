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
- [ ] Fotos reais dos produtos (hoje é ilustração SVG em `AcaiCup.tsx`)
- [ ] Logo oficial no lugar do selo "MR"
- [ ] Imagem `public/og.png` (1200x630) pro compartilhamento
- [ ] Domínio + deploy (Netlify ou Vercel, build `npm run build`, pasta `dist`)
- [ ] Loja aberta no iFood e link colado em `business.ts` — ver `docs/ifood.md`

## Imagens

Originais ficam em `assets-originais/` (fora do build). As versões que o site
usa são geradas por script:

```bash
cd site
npm run images
```

Isso produz `public/imagem/`: foto do produto em WebP 900px, logo em WebP
256px, ícone PNG 192px e a imagem de compartilhamento `og.jpg` (1200x630).
Para adicionar a foto de um novo produto, jogue o original em
`assets-originais/`, registre em `scripts/optimize-images.mjs` e aponte o campo
`image` do produto em `src/data/products.ts`.
