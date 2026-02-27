/**
 * Script pour générer les icônes PWA à partir du SVG
 * Usage: npx sharp-cli ou node scripts/generate-icons.mjs
 *
 * Prérequis: npm install sharp --save-dev (temporaire)
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

async function generateIcons() {
  let sharp
  try {
    sharp = (await import('sharp')).default
  } catch {
    console.log('Sharp not installed. Run: npm install sharp --save-dev')
    console.log('')
    console.log('Alternative: Convert manually using:')
    console.log('  - https://cloudconvert.com/svg-to-png')
    console.log('  - Inkscape: inkscape -w 512 -h 512 icon.svg -o icon-512.png')
    console.log('  - ImageMagick: convert -background none icon.svg -resize 512x512 icon-512.png')
    process.exit(1)
  }

  const svgPath = join(publicDir, 'icon.svg')
  const svgBuffer = readFileSync(svgPath)

  const sizes = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
  ]

  for (const { name, size } of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(publicDir, name))
    console.log(`✓ Generated ${name} (${size}x${size})`)
  }

  // Also create favicon.ico (32x32)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, 'favicon-32.png'))
  console.log('✓ Generated favicon-32.png (32x32)')

  console.log('')
  console.log('Done! Icons generated in public/')
}

generateIcons().catch(console.error)
