# WhatsApp automático: o que dá e o que não dá hoje

Como funciona hoje o aviso de entrega, o que já é automático de verdade e o
que ainda depende de alguém apertar enviar.

## O fluxo que existe hoje

1. A loja dá baixa no pedido (status **Concluído**) no painel `/sistema`
2. Com "Avisar o cliente ao dar baixa" ligado (Configurações), o WhatsApp do
   cliente abre em uma aba nova com a mensagem já escrita, incluindo o link
   `acaiteriamr.com.br/?pedido=1000`
3. O atendente aperta enviar. Esse é o único passo manual
4. O cliente toca no link e cai no site, no card **"Chegou tudo certo?"**
5. Tocando em **"Recebi, tudo certo"**, acontece duas coisas ao mesmo tempo:
   - A loja recebe no WhatsApp a confirmação de recebimento do pedido #1000
   - O cliente é levado direto para a seção de depoimentos, com o formulário de
     avaliação aberto (nota, comentário e autorização de publicação)
6. Se o pedido não chegou, o botão **"Ainda não chegou"** abre o WhatsApp da
   loja com o aviso pronto

Se o cliente ignorar o link, o convite de avaliação aparece sozinho numa visita
seguinte, passados o tempo médio de entrega mais 30 minutos.

Onde isso mora no código:

- Mensagem e link: `src/orders/messages.ts`
- Card de confirmação: `src/components/OrderConfirm.tsx`
- Marcação de "já confirmou": `src/orders/confirmation.ts`
- Convite de avaliação: `src/components/ReviewInvite.tsx`
- Ligação das duas etapas: `src/App.tsx`

## Por que ainda tem um clique no meio

O site é estático (Netlify, sem servidor). Um site estático não consegue
disparar mensagem sozinho: `wa.me` só abre a conversa com o texto pronto, quem
envia é a pessoa. Para o envio sair sem ninguém tocar, é preciso um servidor
falando com uma API de WhatsApp.

## Os dois caminhos para envio 100% automático

### 1. WhatsApp Cloud API (oficial, da Meta)

- **Como fica:** uma função serverless (Netlify Functions ou Supabase Edge
  Function) recebe a mudança de status e manda a mensagem pela API da Meta
- **Custo:** conversa de atendimento iniciada pelo cliente é gratuita. Como o
  cliente manda o pedido pelo WhatsApp antes, a janela de 24h fica aberta e o
  aviso de entrega cai dentro dela, sem custo. Fora da janela, precisa de
  template aprovado e aí é pago (centavos por mensagem)
- **Ponto de atenção sério:** o número migrado para a Cloud API **sai do
  aplicativo normal do WhatsApp**. A loja perde o WhatsApp do celular naquele
  número e passa a atender por uma caixa de entrada (a da Meta ou uma
  ferramenta tipo Chatwoot). Para uma operação que responde pelo celular, isso
  muda a rotina inteira
- **Saída possível:** usar um segundo número só para os avisos automáticos e
  manter o número atual no aplicativo para conversar

### 2. API não oficial (Z-API, Evolution API, WPPConnect)

- **Como fica:** o número atual continua no celular, um serviço lê e envia por
  ele. É o caminho mais usado por delivery pequeno no Brasil
- **Custo:** Z-API e similares em torno de R$ 100 a R$ 200 por mês; Evolution
  API é aberta e roda em VPS (a partir de ~R$ 30/mês, mas exige manutenção)
- **Risco:** não é homologado pela Meta. Existe risco de bloqueio do número,
  baixo em volume pequeno e mensagem transacional, mas real

## Recomendação

Manter o fluxo atual. O único passo manual é apertar enviar em uma conversa que
já abriu com o texto pronto, e a loja precisa mesmo estar de olho no WhatsApp
naquele momento. Automatizar de verdade custa dinheiro todo mês ou tira o
número do celular.

O momento de mexer nisso é quando o volume passar de algo como 30 pedidos por
dia, ou quando os pedidos migrarem para o Supabase (ver `sistema.md`) e já
existir servidor no fluxo. Aí a Cloud API com número dedicado vira o caminho
natural.

## O que a confirmação registra

Com o banco no lugar (ver `supabase.md`), tocar em "Recebi, tudo certo" faz
duas coisas: manda o aviso no WhatsApp e **carimba a confirmação no pedido**.
O cartão do pedido no painel passa a mostrar "Cliente confirmou o recebimento
às 20:14", então dá para saber o que chegou de verdade sem depender de ler
conversa.

As avaliações também entram no banco na hora do envio e aparecem na aba
**Avaliações**, com o botão de publicar no site.
