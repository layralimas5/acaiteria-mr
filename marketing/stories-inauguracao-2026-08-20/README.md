# Stories de inauguração — Açaiteria MR

Quatro stories 1080x1920 prontos pra postar, na sequência que leva de
"abriu" até "segue a gente".

## Os quatro

| # | Story | O que faz |
| --- | --- | --- |
| 01 | Anúncio | abre a sequência com o casal e a data de 5 de setembro |
| 02 | Tamanhos | 500ml, 700ml e 1 litro, com os três complementos grátis |
| 03 | Como pedir | os três passos, o site e a taxa de cada cidade |
| 04 | Segue a gente | CTA de seguir, com os personagens e o @ em destaque |

Os PNGs ficam em `stories/`.

## Ordem de postagem

Posta os quatro em sequência, na mesma tacada. O 04 é sempre o último: a
pessoa acabou de ver o que a loja faz, é ali que ela segue.

Nos dias antes da inauguração dá pra postar só o 01, e guardar o 02, 03 e
04 pro dia 5.

## Figurinhas por cima (no app)

- **01** — contagem regressiva marcada pra 5 de setembro.
- **02** — enquete: "qual você pediria?" com 500ml / 1 litro.
- **03** — link do site (`acaiteria-mr.netlify.app`) colado sobre o passo 1.
- **04** — a figurinha nativa de **seguir**, encostada no @mracai9.

Os stories têm 220px livres em cima e 250px embaixo justamente pra
figurinha não cobrir texto.

## Pendências

- [ ] **A foto dos copos** (story 02) é a antiga: os rótulos na arte dizem
      300ml e 700ml, e agora a linha é 500ml, 700ml e 1 litro. Os textos do
      story já estão certos, a foto não. Vale pedir foto nova dos três
      tamanhos que a loja vende hoje.
- [ ] Confirmar o horário de abertura no dia (os stories não citam horário)
- [ ] Trocar o endereço do site quando o domínio `acaiteriamr.com.br` for
      apontado: hoje está `acaiteria-mr.netlify.app` no story 03

## Trocar os textos

Tudo que é texto está no bloco `DADOS`, no fim do `stories.html`. Muda lá
e roda:

```bash
NODE_PATH="../../../../marketing/conteudo/node_modules" node render.js
```

Sai `stories/story-01.png` a `story-04.png` de novo, em 1080x1920.

Trocar a data, por exemplo, é mexer só em `abertura1`.

## De onde vem cada arte

As imagens são as mesmas do site, em `site/public/imagem/`: `banner-2`
(casal com o pote) no story 01 e no 04, em enquadramentos diferentes,
`banner` (os copos) no 02 e `logo-oficial` no medalhão redondo de todos.

O `banner-3` ficou de fora: ele traz o letreiro da marca desenhado no meio
da arte, que brigava com a logo do topo.
