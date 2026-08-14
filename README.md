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
| Produtos, preços, categorias, complementos | `site/src/data/products.ts` |
| Regras de link de pedido (iFood vs WhatsApp) | `site/src/lib/order.ts` |
| Cores e tipografia | `site/src/index.css` (bloco `@theme`) |

Nenhum componente tem telefone, preço ou link hardcoded. Tudo vem desses arquivos.

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
