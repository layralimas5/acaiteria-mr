# Pix copia e cola

Como ligar o Pix da loja e o que o cliente vê na tela.

## O que muda para o cliente

Antes ele escolhia Pix, lia a chave, digitava no banco e digitava o valor na
mão. Cada passo desses é um jeito de errar: chave trocada, centavo a menos,
comprovante que não bate com o pedido.

Agora, ao enviar o pedido, aparece o **código Pix copia e cola** já com o valor
fechado (itens mais a taxa de entrega) e com o número do pedido na referência.
Um toque em "Copiar código Pix", cola no banco, confirma. No computador
aparece também o **QR Code**, para quem paga pelo celular.

No extrato da loja o pagamento chega identificado como `MR1001`, o mesmo
número que está no painel. É assim que se confere quem pagou sem abrir
comprovante.

## Ligar

Um campo só, em `site/src/config/business.ts`:

```ts
payments: {
  pixKey: '+5527992853101',
  pixHolder: 'Açaiteria MR',
  pixCity: 'Viana',
}
```

| Campo | O que é |
| --- | --- |
| `pixKey` | A chave, no formato exato do banco. Vazia esconde o Pix copia e cola |
| `pixHolder` | Nome do recebedor que o app do cliente mostra. Até 25 caracteres |
| `pixCity` | Município do recebedor. Até 15 caracteres. Exigido pelo padrão |

Acento e cedilha não são problema: o código sai com o texto já convertido
("Açaiteria MR" vira "ACAITERIA MR"), que é o que os bancos aceitam.

## O formato da chave importa

Errar o formato faz o app do cliente recusar o código inteiro. A chave tem que
ir **como está cadastrada no banco**:

| Tipo | Como escrever |
| --- | --- |
| Telefone | Com DDI e sinal: `+5527992853101` |
| CPF ou CNPJ | Só dígitos, sem ponto, barra ou traço: `12345678000199` |
| E-mail | Em minúsculas |
| Aleatória | A chave inteira, com os hifens |

Telefone sem o `+55` é o erro mais comum e o mais difícil de perceber: o site
gera o código, o cliente cola e o banco diz que o QR é inválido.

## Testar antes de soltar

1. Preencha `pixKey` e rode `npm run dev`
2. Monte um pedido barato de verdade, escolha **Pix** e envie
3. Na tela de pedido enviado, copie o código e cole no seu banco
4. Confira três coisas antes de confirmar: o **nome do recebedor**, o **valor**
   e se a referência do pedido aparece
5. Pague e veja se cai identificado no extrato

Esse teste vale mais do que qualquer conferência de código: se o banco aceitou
e o dinheiro caiu certo, está pronto.

## Como funciona por dentro

`site/src/lib/pix.ts` monta o **BR Code** do Banco Central: uma sequência de
campos `id + tamanho + valor`, fechada por um CRC16. Tudo acontece no
navegador, sem servidor e sem chamada de rede: é o mesmo código que o banco
leria de um QR impresso no balcão.

`site/src/components/PixCode.tsx` é a tela: botão de copiar, o código à mostra
para quem preferir selecionar na mão, e o QR desenhado em SVG. O QR fica
escondido no celular de propósito: ninguém aponta a câmera para a própria tela,
lá o que resolve é o botão de copiar.

O valor nunca é digitado por ninguém: sai do total do pedido que já foi gravado
no banco.

## Pix na entrega continua existindo

O código copia e cola é para quem quer pagar na hora. Quem preferir pagar
quando o entregador chegar continua escolhendo Pix e acertando na porta: a
loja combina pelo WhatsApp, como sempre.

## Diferença para o pagamento online

O Pix daqui cai direto na conta da loja, sem taxa e sem intermediário, mas
**ninguém confirma o pagamento automaticamente**: alguém da loja olha o extrato
ou o comprovante que o cliente mandar.

O pagamento online da InfinitePay (`docs/infinitepay.md`) faz o contrário: tem
taxa e passa por um intermediário, mas o pedido nasce marcado como pago no
painel, sem ninguém conferir nada, e aceita cartão em até 12x.

Os dois podem ficar ligados ao mesmo tempo. São opções diferentes na mesma
tela de pagamento.
