// Rasterize the Waystone waymark chevron to PNGs (iOS apple-touch-icon needs a
// PNG; Android benefits from PNG maskables too). Full-bleed teal so iOS rounds
// the corners cleanly. Run with: node scripts/generate-icons.mjs
import sharp from 'sharp'

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#3f7d6e"/>
  <path d="M180 306 L256 212 L332 306" fill="none" stroke="#fbf8f1" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

const buf = Buffer.from(svg)
const render = (name, size) =>
  sharp(buf, { density: 384 }).resize(size, size).png().toFile(`public/${name}`)

await Promise.all([
  render('apple-touch-icon.png', 180),
  render('pwa-192.png', 192),
  render('pwa-512.png', 512),
])
console.log('Generated apple-touch-icon.png, pwa-192.png, pwa-512.png')
