import sharp from 'sharp'

/**
 * Remove o fundo liso das fotos de produto.
 *
 * O recorte parte das bordas da imagem e só apaga o que estiver conectado a
 * elas, então o roxo do próprio açaí nunca é afetado — diferente de um
 * chroma-key por cor, que comeria o produto junto.
 */

/**
 * Tolerância baixa de propósito: o copo é de plástico translúcido e deixa o
 * roxo do fundo aparecer nas bordas. Com tolerância alta, o preenchimento
 * atravessa a parede do copo e come o produto por dentro.
 */
const TOLERANCE = 18

/** A partir daqui a imagem só tem a base do copo e a sombra projetada. */
const SHADOW_ZONE = 0.62
const SHADOW_TOLERANCE = 78

/**
 * A sombra é o próprio fundo com menos luz: mesma direção de cor, brilho
 * menor. Mede a distância do pixel até a reta preto → cor de fundo.
 */
const shadowDistance = (data, index, reference) => {
  const [rr, rg, rb] = reference
  const norm = rr * rr + rg * rg + rb * rb
  if (norm === 0) return Number.POSITIVE_INFINITY

  const r = data[index]
  const g = data[index + 1]
  const b = data[index + 2]

  // O fundo tem vinheta: perto da base ele fica mais claro que a amostra das
  // bordas, então a projeção pode passar de 1 sem deixar de ser fundo.
  const projection = (r * rr + g * rg + b * rb) / norm
  if (projection > 1.45) return Number.POSITIVE_INFINITY

  const dr = r - rr * projection
  const dg = g - rg * projection
  const db = b - rb * projection
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

const colorDistance = (data, index, reference) => {
  const dr = data[index] - reference[0]
  const dg = data[index + 1] - reference[1]
  const db = data[index + 2] - reference[2]
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

const referenceColor = (data, width, height, channels) => {
  const samples = []
  const push = (x, y) => {
    const i = (y * width + x) * channels
    samples.push([data[i], data[i + 1], data[i + 2]])
  }

  for (let x = 0; x < width; x += 8) {
    push(x, 0)
    push(x, height - 1)
  }
  for (let y = 0; y < height; y += 8) {
    push(0, y)
    push(width - 1, y)
  }

  const total = samples.reduce(
    (acc, [r, g, b]) => [acc[0] + r, acc[1] + g, acc[2] + b],
    [0, 0, 0],
  )
  return total.map((value) => Math.round(value / samples.length))
}

/**
 * Retângulo do produto propriamente dito: só entram pixels bem distantes da
 * cor de fundo, o que exclui a sombra e o halo de luz do estúdio. Linhas e
 * colunas com pouquíssimos pixels são descartadas para respingos não
 * esticarem a área.
 */
const coreBounds = (data, width, height, channels, reference) => {
  const CORE_DISTANCE = 155
  const MIN_PIXELS = 6

  const rows = new Uint32Array(height)
  const cols = new Uint32Array(width)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * channels
      if (colorDistance(data, index, reference) < CORE_DISTANCE) continue
      rows[y] += 1
      cols[x] += 1
    }
  }

  const firstIndex = (counts) => counts.findIndex((count) => count >= MIN_PIXELS)
  const lastIndex = (counts) => counts.length - 1 - [...counts].reverse().findIndex((count) => count >= MIN_PIXELS)

  return {
    top: Math.max(0, firstIndex(rows)),
    bottom: Math.min(height - 1, lastIndex(rows)),
    left: Math.max(0, firstIndex(cols)),
    right: Math.min(width - 1, lastIndex(cols)),
  }
}

/** Mantém apenas o maior bloco conectado de pixels que não são fundo. */
const largestComponent = (isBackground, width, height) => {
  const visited = new Uint8Array(width * height)
  const best = new Uint8Array(width * height)
  let bestSize = 0

  for (let start = 0; start < visited.length; start += 1) {
    if (isBackground[start] || visited[start]) continue

    const stack = [start]
    const component = []
    visited[start] = 1

    while (stack.length > 0) {
      const pixel = stack.pop()
      component.push(pixel)

      const x = pixel % width
      const y = Math.floor(pixel / width)
      const neighbours = [
        x > 0 ? pixel - 1 : -1,
        x < width - 1 ? pixel + 1 : -1,
        y > 0 ? pixel - width : -1,
        y < height - 1 ? pixel + width : -1,
      ]

      for (const next of neighbours) {
        if (next < 0 || visited[next] || isBackground[next]) continue
        visited[next] = 1
        stack.push(next)
      }
    }

    if (component.length > bestSize) {
      bestSize = component.length
      best.fill(0)
      for (const pixel of component) best[pixel] = 1
    }
  }

  return best
}

/** @returns {Promise<Buffer>} PNG com fundo transparente. */
export const cutoutBackground = async (inputPath) => {
  const image = sharp(inputPath).ensureAlpha()
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info

  const reference = referenceColor(data, width, height, channels)
  const isBackground = new Uint8Array(width * height)
  const queue = []

  const shadowStart = Math.floor(height * SHADOW_ZONE)

  const visit = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const pixel = y * width + x
    if (isBackground[pixel]) return

    const index = pixel * channels
    const matches =
      y >= shadowStart
        ? shadowDistance(data, index, reference) <= SHADOW_TOLERANCE
        : colorDistance(data, index, reference) <= TOLERANCE

    if (!matches) return
    isBackground[pixel] = 1
    queue.push(pixel)
  }

  for (let x = 0; x < width; x += 1) {
    visit(x, 0)
    visit(x, height - 1)
  }
  for (let y = 0; y < height; y += 1) {
    visit(0, y)
    visit(width - 1, y)
  }

  while (queue.length > 0) {
    const pixel = queue.pop()
    const x = pixel % width
    const y = Math.floor(pixel / width)
    visit(x - 1, y)
    visit(x + 1, y)
    visit(x, y - 1)
    visit(x, y + 1)
  }

  // O halo de luz do fundo sobrevive ao preenchimento por ser mais claro que o
  // roxo base. Ele fica separado do copo pela sombra já removida, então basta
  // manter o maior bloco conectado — o produto — e descartar o resto.
  const keep = largestComponent(isBackground, width, height)
  const core = coreBounds(data, width, height, channels, reference)
  const MARGIN = 10
  const FEATHER = 16

  // Fator de 0 a 1 conforme a distância para dentro da área do produto.
  const window = (value, min, max) => {
    const inside = Math.min(value - (min - MARGIN), max + MARGIN - value)
    if (inside <= 0) return 0
    return Math.min(1, inside / FEATHER)
  }

  // Máscara em 1 canal, borrada para a borda do produto não ficar serrilhada.
  const mask = Buffer.alloc(width * height)
  for (let pixel = 0; pixel < keep.length; pixel += 1) {
    if (!keep[pixel]) continue
    const x = pixel % width
    const y = Math.floor(pixel / width)
    mask[pixel] = Math.round(255 * window(x, core.left, core.right) * window(y, core.top, core.bottom))
  }

  // toColourspace('b-w') é obrigatório: sem ele o sharp devolve o buffer em
  // três canais depois do blur e o alpha sai embaralhado.
  const softMask = await sharp(mask, { raw: { width, height, channels: 1 } })
    .blur(1.1)
    .linear(1.35, -34)
    .toColourspace('b-w')
    .raw()
    .toBuffer()

  if (softMask.length !== width * height) {
    throw new Error(`máscara com ${softMask.length} bytes, esperado ${width * height}`)
  }

  const rgb = Buffer.alloc(width * height * 3)
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    rgb[pixel * 3] = data[pixel * channels]
    rgb[pixel * 3 + 1] = data[pixel * channels + 1]
    rgb[pixel * 3 + 2] = data[pixel * channels + 2]
  }

  return sharp(rgb, { raw: { width, height, channels: 3 } })
    .joinChannel(softMask, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer()
}
