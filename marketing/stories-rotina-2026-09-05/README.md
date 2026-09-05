# Stories de rotina — Açaiteria MR

Oito stories 1080x1920 pra usar depois da inauguração, no dia a dia da
loja. Não têm data escrita na arte: servem a semana inteira e podem ser
repostados sem envelhecer.

## Os oito

| # | Story | O que faz |
| --- | --- | --- |
| 01 | Aberto agora | selo dourado de "aberto", o casal e "hoje até 23h" |
| 02 | Horário da semana | os sete dias, com quinta e domingo apagados |
| 03 | 1 litro | a foto do pote grande e os três tamanhos |
| 04 | Sem app, sem cadastro | o site como caminho do pedido |
| 05 | Como pagar | Pix na hora e cartão em até 12x, os dois pelo site |
| 06 | Entrega | taxa de Viana e Cariacica e o prazo mínimo |
| 07 | Enquete | qual complemento não pode faltar |
| 08 | Pede o seu | CTA final, com a seta apontando pro link |

Os PNGs ficam em `stories/`.

## Como usar na semana

Não posta os oito de uma vez: eles foram feitos pra rodar avulsos.

- **Todo dia que abre** — o 01, na hora que liga o balcão.
- **Segunda** — o 02, pra fixar o horário na cabeça de quem começou a
  seguir na semana anterior.
- **Meio de semana** — 03, 04, 05 ou 06, um por dia, revezando.
- **Dia de pouco movimento** — o 07: enquete puxa resposta e resposta
  puxa alcance.
- **Sempre por último** — o 08, no fim da sequência do dia. É o único
  que pede o pedido de forma direta.

## Figurinhas por cima (no app)

- **01** — link do site colado embaixo de "Hoje até 23h".
- **02** — nenhuma. A arte já está cheia.
- **03** — enquete "500ml ou 1 litro?" ou a de deslizar, com o emoji do açaí.
- **04** — o link do site em cima da pílula escrita `acaiteria-mr.netlify.app`.
- **05** — nenhuma. Informação demais na tela.
- **06** — figurinha de localização (Viana, ES).
- **07** — a enquete nativa por cima das três opções, com as mesmas palavras.
- **08** — link do site em cima da seta, e a figurinha de seguir no @.

Os stories têm 220px livres em cima e 250px embaixo justamente pra
figurinha não cobrir texto.

## De onde vêm os dados

Tudo o que é número saiu de `site/src/config/business.ts`: horário
(18h30 às 23h, fechado quinta e domingo), taxa de R$ 3 em Viana e R$ 6
em Cariacica, prazo mínimo de 40 minutos, Pix e cartão em 12x pelo site,
sem maquininha e sem dinheiro na entrega. Mudou lá, muda aqui também.

Preço de copo não entra em story nenhum: o cardápio vive no banco e muda
pelo painel, então arte com preço nasce vencida.

## Pendências

- [ ] Trocar `acaiteria-mr.netlify.app` (stories 04 e o README) quando o
      domínio `acaiteriamr.com.br` for apontado
- [ ] Confirmar com a loja se os três complementos da enquete (leite
      ninho, morango e paçoca) são mesmo os mais pedidos
- [ ] Falta um story de prova social: assim que chegar o primeiro print
      de cliente elogiando, vale virar o nono

## Trocar os textos

Tudo que é texto está no bloco `DADOS`, no fim do `stories.html`. Muda lá
e roda:

```bash
NODE_PATH="../../../../marketing/conteudo/node_modules" node render.js
```

Sai `stories/story-01.png` a `story-08.png` de novo, em 1080x1920.

## De onde vem cada arte

As imagens são as mesmas do site, em `site/public/imagem/`: `banner-2`
(casal com o pote) no 01 e no 08, em enquadramentos diferentes, `banner`
(os copos) no 04, `1-litro` no 03 e `logo-oficial` no medalhão redondo de
todos. Os stories 02, 05, 06 e 07 são só fundo roxo: são os de ler, não
os de olhar.
