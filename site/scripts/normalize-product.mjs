import sharp from 'sharp'

/**
 * Deixa todas as fotos de produto na mesma escala.
 *
 * Cada foto vem do estúdio com o copo num tamanho diferente dentro do quadro.
 * Aqui a gente mede onde o produto começa e termina (o que destoa do fundo
 * liso), recorta um quadrado em volta dele e reenquadra de modo que o copo
 * ocupe sempre a mesma fatia da imagem final.
 */

/** Quanto da altura final o produto deve ocupar. */
const TARGET_HEIGHT_RATIO = 0.82
/** Limite de segurança para o produto não encostar nas laterais. */
const MAX_WIDTH_RATIO = 0.9
/** Distância de cor a partir da qual o pixel é produto, e não fundo/sombra. */
const PRODUCT_DISTANCE = 70
const MIN_PIXELS_PER_LINE = 8

const backgroundColor = (data, width, height, channels) => {
  const samples = []
  const push = (x, y) => {
    const i = (y * width + x) * channels
    samples.push([data[i], data[i + 1], data[i + 2]])
  }

  for (let x = 0; x < width; x += 6) {
    push(x, 0)
    push(x, height - 1)
  }
  for (let y = 0; y < height; y += 6) {
    push(0, y)
    push(width - 1, y)
  }

  const sum = samples.reduce((acc, [r, g, b]) => [acc[0] + r, acc[1] + g, acc[2] + b], [0, 0, 0])
  return sum.map((value) => Math.round(value / samples.length))
}

const productBounds = (data, width, height, channels, background) => {
  const rows = new Uint32Array(height)
  const cols = new Uint32Array(width)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * channels
      const dr = data[i] - background[0]
      const dg = data[i + 1] - background[1]
      const db = data[i + 2] - background[2]

      if (Math.sqrt(dr * dr + dg * dg + db * db) < PRODUCT_DISTANCE) continue
      rows[y] += 1
      cols[x] += 1
    }
  }

  const first = (counts) => counts.findIndex((count) => count >= MIN_PIXELS_PER_LINE)
  const last = (counts) => {
    for (let i = counts.length - 1; i >= 0; i -= 1) {
      if (counts[i] >= MIN_PIXELS_PER_LINE) return i
    }
    return counts.length - 1
  }

  return { top: first(rows), bottom: last(rows), left: first(cols), right: last(cols) }
}

/**
 * @param {string} inputPath
 * @returns {Promise<Buffer>} PNG quadrado com o produto na escala padrão.
 */
export const normalizeProduct = async (inputPath) => {
  const source = sharp(inputPath)
  const { data, info } = await source.raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info

  const background = backgroundColor(data, width, height, channels)
  const bounds = productBounds(data, width, height, channels, background)

  const productHeight = bounds.bottom - bounds.top
  const productWidth = bounds.right - bounds.left
  const side = Math.round(
    Math.max(productHeight / TARGET_HEIGHT_RATIO, productWidth / MAX_WIDTH_RATIO),
  )

  const centerX = Math.round((bounds.left + bounds.right) / 2)
  const centerY = Math.round((bounds.top + bounds.bottom) / 2)

  // Margem generosa para o recorte poder sair da imagem original sem estourar.
  const pad = side
  const padded = await sharp(inputPath)
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: { r: background[0], g: background[1], b: background[2] },
    })
    .toBuffer()

  return sharp(padded)
    .extract({
      left: centerX - Math.round(side / 2) + pad,
      top: centerY - Math.round(side / 2) + pad,
      width: side,
      height: side,
    })
    .png()
    .toBuffer()
}
