const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const OUT_DIR = path.join(__dirname, 'stories')
const HTML = 'file://' + path.join(__dirname, 'stories.html').replace(/\\/g, '/')

;(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const browser = await chromium.launch()
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
  })

  await page.goto(HTML, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(600)

  const stories = await page.locator('.story').all()
  if (stories.length === 0) throw new Error('Nenhum .story encontrado no HTML')

  for (let i = 0; i < stories.length; i++) {
    const file = path.join(OUT_DIR, `story-${String(i + 1).padStart(2, '0')}.png`)
    await stories[i].screenshot({ path: file })
    console.log('ok', path.basename(file))
  }

  await browser.close()
  console.log(`\n${stories.length} stories renderizados em ${OUT_DIR}`)
})().catch((err) => {
  console.error('Falhou:', err.message)
  process.exit(1)
})
