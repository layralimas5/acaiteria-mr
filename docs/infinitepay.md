# Pagamento online pela InfinitePay

O cliente monta o açaí, preenche o endereço, escolhe **Pix ou cartão pelo
site** e vai para a tela segura da InfinitePay. Pagou, o dinheiro cai na conta
da loja e o pedido aparece no painel já marcado como **Pago**, sem ninguém
conferir extrato.

Custa zero: o Checkout Integrado da InfinitePay é gratuito, você paga só a taxa
normal da venda. Aceita Pix e cartão em até 12x.

---

## O que já está pronto no sistema

| Peça | Onde |
| --- | --- |
| Opção "Pix ou cartão pelo site" no checkout | `site/src/components/CheckoutForm.tsx` |
| Liga/desliga a opção | `site/src/config/business.ts` (`payments.onlineCheckout`) |
| Geração do link de cobrança (servidor) | `site/netlify/functions/pagamento-link.mts` |
| Confirmação do pagamento (servidor) | `site/netlify/functions/infinitepay-webhook.mts` |
| Colunas de pagamento no banco | `supabase/migrations/0004_payments.sql` |
| Selo "Pago" no painel | `site/src/admin/PaymentBadge.tsx` |
| Tela de retorno do pagamento | `site/src/components/PaymentReturn.tsx` |

Falta só **ligar**: são quatro passos, uns dez minutos.

---

## Passo 1 — Pegar a InfiniteTag da cliente

No app da InfinitePay: **Vendas → Checkout → Configurações**. Ou pela web, em
<https://app.infinitepay.io/external-checkout>.

A InfiniteTag é aquele identificador que aparece no canto superior esquerdo do
app, começando com `$`. **Anote sem o `$`.** Se lá está `$acaiteriamr`, o valor
que interessa é `acaiteriamr`.

É a conta bancária da cliente que recebe. Você não precisa de senha, chave de
API nem acesso ao app dela: a InfiniteTag basta, e ela só serve para *receber*
dinheiro naquela conta.

## Passo 2 — Rodar a migration no Supabase

No Supabase da loja, **SQL Editor**, colar o conteúdo inteiro de
`supabase/migrations/0004_payments.sql` e executar. Pode rodar mais de uma vez
sem estragar nada.

Isso cria em cada pedido o estado do pagamento (`na_entrega`, `aguardando`,
`pago`, `falhou`), o número da transação e o link do comprovante.

## Passo 3 — Configurar as variáveis no Netlify

No painel do Netlify do site: **Site configuration → Environment variables →
Add a variable**. São três:

| Variável | Valor | Onde achar |
| --- | --- | --- |
| `INFINITEPAY_HANDLE` | a InfiniteTag sem o `$` | passo 1 |
| `SUPABASE_URL` | o endereço do projeto, terminando em `.supabase.co` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | a chave `service_role` (ou `secret`) | Supabase → Project Settings → API |

> **Atenção na terceira.** A `service_role` ignora todo o Row Level Security do
> banco. Ela vive **só** nas variáveis do Netlify, onde apenas o servidor lê.
> Nunca no `.env` do site, nunca num arquivo com prefixo `VITE_`, nunca no
> GitHub: qualquer variável `VITE_` entra inteira no JavaScript que o visitante
> baixa, e essa daria acesso total ao banco a qualquer pessoa.

Repare que **nenhuma dessas três tem prefixo `VITE_`**. É o que garante que elas
fiquem no servidor.

## Passo 4 — Ligar a opção no site

Em `site/src/config/business.ts`:

```ts
payments: {
  // ...
  onlineCheckout: true,
},
```

Commit, push, o Netlify publica. A opção aparece no checkout, já como a
primeira da lista.

**Ordem importa:** ligar isso antes do passo 3 faz o cliente ver a opção e levar
erro na hora de pagar. Variáveis primeiro, `true` depois.

---

## Como testar antes de soltar para o público

1. Fazer um pedido de verdade no site, escolhendo "Pix ou cartão pelo site".
2. Pagar um valor baixo no Pix (monte o menor copo, sem complemento pago).
3. Conferir três coisas:
   - o site volta dizendo **Pagamento confirmado**;
   - o painel em `/sistema` mostra o pedido com o selo verde **Pago** e o link
     do comprovante;
   - o dinheiro aparece no app da InfinitePay.
4. Depois é só a cliente estornar pelo app, se quiser.

Se o selo não virar "Pago" em uns segundos, o pagamento caiu mas o aviso não
chegou. Veja em **Netlify → Logs → Functions → infinitepay-webhook** o que a
função respondeu.

---

## Como funciona por dentro (e por que assim)

O caminho tem uma regra que não se negocia: **o preço nunca vem do navegador.**

1. O cliente envia o pedido. Ele é gravado no Supabase pela função
   `create_order`, que recalcula item por item a partir do cardápio. O total é
   decidido no banco.
2. O site pede o link de pagamento à função do Netlify, mandando **só o número
   do pedido**.
3. A função lê o total no banco e é ela quem chama a InfinitePay. Se alguém
   mexer no site pelo navegador, o máximo que consegue é pedir o link do
   próprio pedido, pelo valor certo.
4. O cliente paga na tela da InfinitePay e volta para o site.
5. A InfinitePay avisa o servidor pelo `webhook_url`. Esse aviso chega **sem
   assinatura**, então ele não é aceito como prova: a função pergunta de volta
   à InfinitePay (`/payment_check`) se aquela cobrança foi mesmo paga, e só
   carimba "pago" se a resposta for sim e o valor cobrir o pedido.
6. A tela de retorno pergunta o estado ao banco de dois em dois segundos,
   porque o cliente pode voltar antes de o webhook chegar.

O que o cliente vê na tela de conclusão, e o que a loja vê no painel, saem
sempre do banco. Nenhuma das duas telas acredita na URL de retorno.

## Detalhes que costumam pegar

- **A entrega entra na cobrança.** O checkout mostra uma linha por item mais a
  taxa de entrega. A soma é conferida contra o total do banco no centavo; se
  divergir, a cobrança sai como uma linha só, pelo valor certo do pedido.
- **Pagamento parcial não passa.** Valor menor que o total do pedido não vira
  "pago".
- **Reenvio não duplica.** A InfinitePay repete o webhook até receber 200. O
  carimbo é idempotente: o mesmo pagamento não vira dois.
- **Cair no meio do caminho não perde o pedido.** Ele já está gravado; a tela
  oferece "Pagar agora" de novo e, se nada funcionar, o WhatsApp.
- **Quem prefere pagar na entrega continua podendo.** Pix na entrega, cartão na
  maquininha e dinheiro seguem na lista, controlados como sempre em
  `business.ts`.

## Para desligar

`onlineCheckout: false` em `business.ts`. A opção some do checkout na hora e
todo pedido volta a ser pago na entrega. Os pedidos já pagos continuam com o
histórico e o comprovante no painel.
