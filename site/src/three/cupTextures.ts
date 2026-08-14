import * as THREE from 'three'

/**
 * Texturas geradas em canvas para o copo 3D. Elas simulam o que se vê pelo
 * plástico: camadas de açaí, creme e granola, com o rótulo da marca repetido
 * ao redor do copo para aparecer de qualquer ângulo.
 */

const LABEL_WIDTH = 2048
const LABEL_HEIGHT = 1024
const LABEL_REPEATS = 2

const paintContents = (ctx: CanvasRenderingContext2D): void => {
  const gradient = ctx.createLinearGradient(0, 0, 0, LABEL_HEIGHT)
  gradient.addColorStop(0, '#3d1a58')
  gradient.addColorStop(0.28, '#2a1042')
  gradient.addColorStop(0.55, '#33144f')
  gradient.addColorStop(1, '#190a27')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, LABEL_WIDTH, LABEL_HEIGHT)

  // Camada de creme.
  const cream = ctx.createLinearGradient(0, LABEL_HEIGHT * 0.3, 0, LABEL_HEIGHT * 0.44)
  cream.addColorStop(0, 'rgba(245, 232, 205, 0)')
  cream.addColorStop(0.35, 'rgba(245, 232, 205, 0.92)')
  cream.addColorStop(0.75, 'rgba(238, 218, 182, 0.85)')
  cream.addColorStop(1, 'rgba(238, 218, 182, 0)')
  ctx.fillStyle = cream
  ctx.fillRect(0, LABEL_HEIGHT * 0.3, LABEL_WIDTH, LABEL_HEIGHT * 0.16)

  // Camada de granola.
  const granola = ctx.createLinearGradient(0, LABEL_HEIGHT * 0.74, 0, LABEL_HEIGHT * 0.86)
  granola.addColorStop(0, 'rgba(190, 140, 78, 0)')
  granola.addColorStop(0.4, 'rgba(190, 140, 78, 0.75)')
  granola.addColorStop(1, 'rgba(150, 104, 55, 0)')
  ctx.fillStyle = granola
  ctx.fillRect(0, LABEL_HEIGHT * 0.74, LABEL_WIDTH, LABEL_HEIGHT * 0.14)

  // Grãos soltos, sempre nos mesmos lugares (sem aleatoriedade em runtime).
  ctx.fillStyle = 'rgba(214, 170, 108, 0.55)'
  for (let i = 0; i < 140; i += 1) {
    const x = ((i * 137) % LABEL_WIDTH) + (i % 7) * 11
    const y = LABEL_HEIGHT * 0.72 + ((i * 53) % Math.round(LABEL_HEIGHT * 0.2))
    ctx.beginPath()
    ctx.ellipse(x, y, 7 + (i % 4), 4 + (i % 3), i, 0, Math.PI * 2)
    ctx.fill()
  }
}

const paintLabel = (ctx: CanvasRenderingContext2D, logo: CanvasImageSource, size: string): void => {
  const slot = LABEL_WIDTH / LABEL_REPEATS
  const logoSize = LABEL_HEIGHT * 0.58
  const logoTop = LABEL_HEIGHT * 0.14

  for (let i = 0; i < LABEL_REPEATS; i += 1) {
    const centerX = slot * i + slot / 2

    // A arte da logo é circular mas o arquivo é quadrado: recorta em círculo
    // para o fundo dela não virar um bloco sobre o copo.
    ctx.save()
    ctx.beginPath()
    ctx.arc(centerX, logoTop + logoSize / 2, logoSize / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(logo, centerX - logoSize / 2, logoTop, logoSize, logoSize)
    ctx.restore()

    const badgeWidth = logoSize * 0.5
    const badgeHeight = logoSize * 0.16
    const badgeX = centerX - badgeWidth / 2
    const badgeY = logoTop + logoSize * 1.02

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.beginPath()
    ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, badgeHeight / 2)
    ctx.fill()

    ctx.fillStyle = '#2c1642'
    ctx.font = `700 ${Math.round(badgeHeight * 0.58)}px Outfit, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(size, centerX, badgeY + badgeHeight / 2)
  }
}

/** Textura lateral do copo: conteúdo + rótulo repetido. */
export const createCupTexture = (logo: CanvasImageSource, size: string): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas')
  canvas.width = LABEL_WIDTH
  canvas.height = LABEL_HEIGHT

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D indisponível para gerar a textura do copo')

  paintContents(ctx)
  paintLabel(ctx, logo, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.wrapS = THREE.RepeatWrapping
  return texture
}

/** Mancha radial usada como sombra projetada no chão. */
export const createShadowTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D indisponível para gerar a sombra')

  const gradient = ctx.createRadialGradient(128, 128, 8, 128, 128, 126)
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.55)')
  gradient.addColorStop(0.55, 'rgba(0, 0, 0, 0.22)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 256)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
