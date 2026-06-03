// Decode an uploaded image, downscale it to a sane maximum dimension, and
// re-encode it so the on-device database (and backups) stay lean. Phone
// photos are often 4000px+; we don't need that for thumbnails or galleries.

export interface ProcessedImage {
  blob: Blob
  width: number
  height: number
}

const MAX_DIM = 1600
const QUALITY = 0.82
const THUMB_DIM = 256
const THUMB_QUALITY = 0.7

export async function processImage(
  file: Blob,
  maxDim: number = MAX_DIM,
  quality: number = QUALITY,
): Promise<ProcessedImage> {
  // `from-image` honours EXIF orientation so portrait phone photos (which carry
  // a rotation flag rather than rotated pixels) aren't stored sideways.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const { width: sw, height: sh } = bitmap

  const scale = Math.min(1, maxDim / Math.max(sw, sh))
  const width = Math.round(sw * scale)
  const height = Math.round(sh * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    // Fall back to storing the original if canvas is unavailable.
    return { blob: file, width: sw, height: sh }
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  )

  return { blob: blob ?? file, width, height }
}

// A small thumbnail for list rows, generated from an already-downscaled blob.
export async function makeThumbnail(source: Blob): Promise<Blob> {
  const { blob } = await processImage(source, THUMB_DIM, THUMB_QUALITY)
  return blob
}
