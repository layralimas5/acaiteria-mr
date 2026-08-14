/**
 * Gera as versões web das imagens da marca a partir dos originais.
 *
 *   npm run images
 *
 * Originais ficam em ../assets-originais (fora do build). O site consome
 * apenas os arquivos gerados em public/imagem.
 */
import { mkdir, readdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { normalizeProduct } from './normalize-product.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = resolve(root, '../assets-originais')
const outputDir = join(root, 'public/imagem')

/** @type {{ source: string, output: string, width: number, height?: number, format: 'webp' | 'png' | 'jpeg', quality: number, product?: boolean }[]} */
const targets = [
  // Fotos de produto com o fundo roxo do estúdio. Elas são exibidas dentro de
  // um quadro (object-cover), então o fundo da foto vira o fundo do quadro.
  { source: 'poto-300ml.png', output: 'poto-300ml.webp', width: 900, format: 'webp', quality: 84, product: true },
  { source: 'pote-500ml.png', output: 'pote-500ml.webp', width: 900, format: 'webp', quality: 84, product: true },
  { source: 'copo-700ml.png', output: 'copo-700ml.webp', width: 900, format: 'webp', quality: 84, product: true },
  // Arte de fundo do banner, em duas larguras (celular e desktop).
  { source: 'banner.png', output: 'banner.webp', width: 1830, format: 'webp', quality: 80 },
  { source: 'banner.png', output: 'banner-960.webp', width: 960, format: 'webp', quality: 78 },
  { source: 'logo-oficial.png', output: 'logo-oficial.webp', width: 256, format: 'webp', quality: 86 },
  { source: 'logo-oficial.png', output: 'logo-192.png', width: 192, format: 'png', quality: 90 },
  // Imagem de compartilhamento (WhatsApp, Instagram, Google).
  { source: 'poto-300ml.png', output: 'og.jpg', width: 1200, height: 630, format: 'jpeg', quality: 82 },
]

const run = async () => {
  const available = await readdir(sourceDir)
  await mkdir(outputDir, { recursive: true })

  for (const target of targets) {
    if (!available.includes(target.source)) {
      console.warn(`ignorado: ${target.source} não está em assets-originais`)
      continue
    }

    // Fotos de produto passam pela normalização de escala antes do resize.
    const input = target.product
      ? await normalizeProduct(join(sourceDir, target.source))
      : join(sourceDir, target.source)

    const pipeline = sharp(input).resize({
      width: target.width,
      height: target.height,
      fit: target.height ? 'cover' : 'inside',
      withoutEnlargement: !target.height,
    })

    const encoded =
      target.format === 'webp'
        ? pipeline.webp({ quality: target.quality })
        : target.format === 'jpeg'
          ? pipeline.jpeg({ quality: target.quality, mozjpeg: true })
          : pipeline.png({ quality: target.quality, compressionLevel: 9 })

    const { size } = await encoded.toFile(join(outputDir, target.output))
    console.log(`${target.output}: ${(size / 1024).toFixed(0)} kB`)
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
