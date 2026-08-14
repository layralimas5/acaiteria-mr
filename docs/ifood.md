# Integração com o iFood — o que dá e o que não dá

## O ponto principal

A API de pedidos do iFood não é aberta. Ela fica no **Portal do Desenvolvedor
iFood** e só é liberada pra empresa que se cadastra como **parceiro de
tecnologia**, passa por análise, assina contrato e homologa a aplicação. É o
caminho de quem faz PDV, ERP ou hub de delivery, não de um site de uma loja
única. Para a Açaiteria MR, que ainda vai abrir, esse caminho não se aplica
agora.

Então o site não "puxa" o cardápio do iFood nem recebe pedido do iFood. O que
ele faz é mandar o cliente pro canal certo.

## O que fazer na prática (ordem)

### 1. Abrir a loja no iFood

Cadastro em `portal.ifood.com.br` (Portal do Parceiro). Precisa de:

- CNPJ ativo com CNAE de alimentação
- Alvará / licença sanitária conforme a prefeitura
- Conta bancária PJ
- Fotos dos produtos e cardápio montado

O iFood cobra comissão por pedido (a faixa varia por plano e por praça, algo
entre 12% e 30% mais taxa fixa por transação). Isso precisa entrar na
formação de preço antes de publicar o cardápio, senão a margem do açaí some.

### 2. Pegar o link da loja

Com a loja no ar, a URL pública é algo como
`https://www.ifood.com.br/delivery/cidade-uf/acaiteria-mr-bairro/<id>`.

Cola essa URL em `site/src/config/business.ts`:

```ts
delivery: {
  ifoodUrl: 'https://www.ifood.com.br/delivery/...',
  ...
}
```

Pronto: todos os botões do site passam a abrir o iFood. Nenhum componente
precisa ser alterado.

### 3. Enquanto o iFood não sai

Com `ifoodUrl` vazio, o site já funciona 100% no WhatsApp: cada card manda uma
mensagem pronta com produto, tamanho e preço. É o canal com margem melhor
(sem comissão), então vale manter os dois no ar mesmo depois do iFood.

## Se um dia quiser integração de verdade

Existem três níveis, do mais barato ao mais caro:

1. **Deep link** (é o que está implementado). Custo zero, sem manutenção.
2. **Hub de delivery** (Neemo, Anota AI, Saipos, Cardápio Web e similares).
   Eles já são homologados no iFood e centralizam pedido de iFood, WhatsApp e
   site num painel só. Custo mensal, integração pronta, sem desenvolvimento.
   **É o caminho que eu recomendo quando o volume crescer.**
3. **Integração direta via API do iFood.** Exige virar parceiro de tecnologia
   homologado, manter servidor recebendo o polling de eventos de pedido,
   confirmar/despachar pedido via API e sustentar isso. Só compensa pra quem
   tem várias lojas ou vende o sistema pra outras.

O código já está preparado pro nível 2 ou 3: toda decisão de "pra onde vai o
pedido" está isolada em `site/src/lib/order.ts`. Trocar o canal é mexer nesse
arquivo, não no site inteiro.

## Cardápio próprio no site (checkout sem iFood)

Se em algum momento a loja quiser receber pedido direto no site sem pagar
comissão, o passo é: carrinho no front, cadastro de pedido no Supabase,
pagamento via Pix (Mercado Pago ou Asaas) e painel de pedidos pra cozinha.
É um projeto separado, cerca de 3 a 4 semanas, e só faz sentido quando o
volume pelo WhatsApp já estiver incomodando.
