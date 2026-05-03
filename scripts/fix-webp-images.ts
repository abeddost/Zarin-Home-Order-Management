/**
 * Converts Bonita.webp and Bravo L.webp in Supabase Storage to JPEG
 * and uploads them as .jpg files to the same bucket path.
 *
 * Run once: npx tsx scripts/fix-webp-images.ts
 */

import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'

// Load .env.local manually (tsx doesn't load it automatically)
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx < 0) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const WEBP_FILES = [
  { webpPath: 'sofas/Bonita.webp', jpgPath: 'sofas/Bonita.jpg' },
  { webpPath: 'sofas/Bravo L.webp', jpgPath: 'sofas/Bravo L.jpg' },
]

const BASE = `${SUPABASE_URL}/storage/v1/object/public/product-images`

async function convertAndUpload(webpPath: string, jpgPath: string) {
  const url = `${BASE}/${encodeURIComponent(webpPath).replace(/%2F/g, '/')}`
  console.log(`Fetching: ${url}`)

  const response = await fetch(url)
  if (!response.ok) {
    console.error(`  ERROR: Could not fetch ${url} — ${response.status} ${response.statusText}`)
    return
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const jpegBuffer = await sharp(buffer).jpeg({ quality: 92 }).toBuffer()
  console.log(`  Converted to JPEG (${jpegBuffer.length} bytes)`)

  const { error } = await supabase.storage
    .from('product-images')
    .upload(jpgPath, jpegBuffer, { contentType: 'image/jpeg', upsert: true })

  if (error) {
    console.error(`  ERROR uploading ${jpgPath}:`, error.message)
    return
  }
  console.log(`  Uploaded as: ${jpgPath}`)
}

async function main() {
  for (const { webpPath, jpgPath } of WEBP_FILES) {
    await convertAndUpload(webpPath, jpgPath)
  }
  console.log('\nDone. Update productImages.ts to use .jpg for Bonita and Bravo L.')
}

main().catch(console.error)
