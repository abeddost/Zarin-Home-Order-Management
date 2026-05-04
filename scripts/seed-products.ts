import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import sharp from 'sharp'

// Load .env.local manually since tsx doesn't pick it up automatically
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) process.env[match[1].trim()] = match[2].trim()
  }
}

const SUPABASE_URL = 'https://jeegxtsfxfatpksbjbaw.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY env var is required')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const IMAGES_BASE = path.join(__dirname, '..', '..') // goes up to /Zarin Home Management System/

interface ProductDef {
  model_name: string
  category: string
  source: string        // relative to IMAGES_BASE
  storage_path: string  // path inside the bucket
  colors: string[]
}

const PRODUCTS: ProductDef[] = [
  // Sofas
  { model_name: 'Almira L',  category: 'Corner Sofa', source: 'Sofas/Almira L.jpg',   storage_path: 'sofas/Almira L.jpg',   colors: [] },
  { model_name: 'Almira',    category: 'Sofa',         source: 'Sofas/Almira.jpg',     storage_path: 'sofas/Almira.jpg',     colors: [] },
  { model_name: 'Angel',     category: 'Sofa',         source: 'Sofas/Angel.jpg',      storage_path: 'sofas/Angel.jpg',      colors: [] },
  { model_name: 'Avanos',    category: 'Sofa',         source: 'Sofas/Avanos.jpg',     storage_path: 'sofas/Avanos.jpg',     colors: [] },
  { model_name: 'Belinda',   category: 'Sofa',         source: 'Sofas/Belinda.jpg',    storage_path: 'sofas/Belinda.jpg',    colors: [] },
  { model_name: 'Bella',     category: 'Sofa',         source: 'Sofas/Bella.jpg',      storage_path: 'sofas/Bella.jpg',      colors: [] },
  { model_name: 'Bonita',    category: 'Sofa',         source: 'Sofas/Bonita.webp',    storage_path: 'sofas/Bonita.webp',    colors: [] },
  { model_name: 'Bravo L',   category: 'Corner Sofa', source: 'Sofas/Bravo L.webp',   storage_path: 'sofas/Bravo L.webp',   colors: [] },
  { model_name: 'Dream',     category: 'Sofa',         source: 'Sofas/Dream.jpg',      storage_path: 'sofas/Dream.jpg',      colors: [] },
  { model_name: 'Lucas',     category: 'Sofa',         source: 'Sofas/Lucas.jpg',      storage_path: 'sofas/Lucas.jpg',      colors: [] },
  { model_name: 'Luna',      category: 'Sofa',         source: 'Sofas/Luna.jpg',       storage_path: 'sofas/Luna.jpg',       colors: [] },
  { model_name: 'Motto',     category: 'Sofa',         source: 'Sofas/Motto.jpg',      storage_path: 'sofas/Motto.jpg',      colors: [] },
  { model_name: 'Pablo L',   category: 'Corner Sofa', source: 'Sofas/Pablo L.jpg',    storage_path: 'sofas/Pablo L.jpg',    colors: [] },
  { model_name: 'Puma',      category: 'Sofa',         source: 'Sofas/Puma.jpg',       storage_path: 'sofas/Puma.jpg',       colors: [] },
  { model_name: 'Tetra',     category: 'Sofa',         source: 'Sofas/Tetra.jpg',      storage_path: 'sofas/Tetra.jpg',      colors: [] },
  { model_name: 'Toscana',   category: 'Sofa',         source: 'Sofas/Toscana.jpg',    storage_path: 'sofas/Toscana.jpg',    colors: [] },
  { model_name: 'Verona',    category: 'Sofa',         source: 'Sofas/Verona.jpg',     storage_path: 'sofas/Verona.jpg',     colors: [] },
  // Tables
  { model_name: 'Bien',               category: 'Dining Table',  source: 'Tables/Bien.jpg',               storage_path: 'tables/Bien.jpg',               colors: [] },
  { model_name: 'Gucci Coffee Table', category: 'Coffee Table',  source: 'Tables/Gucci Coffee Table.jpg', storage_path: 'tables/Gucci Coffee Table.jpg', colors: [] },
  { model_name: 'Gucci Dining Table', category: 'Dining Table',  source: 'Tables/Gucci Dining Table.jpg', storage_path: 'tables/Gucci Dining Table.jpg', colors: [] },
  { model_name: 'Gucci Side Table',   category: 'Side Table',    source: 'Tables/Gucci Side table.jpg',   storage_path: 'tables/Gucci Side table.jpg',   colors: [] },
  { model_name: 'Gucci TV Table',     category: 'TV Table',      source: 'Tables/Gucci TV table.jpeg',    storage_path: 'tables/Gucci TV table.jpeg',    colors: [] },
  { model_name: 'Puma Table',         category: 'Coffee Table',  source: 'Tables/Puma.jpg',               storage_path: 'tables/Puma.jpg',               colors: [] },
  { model_name: 'Ravien',             category: 'Dining Table',  source: 'Tables/Ravien.jpeg',            storage_path: 'tables/Ravien.jpeg',            colors: [] },
  { model_name: 'Roma',               category: 'Dining Table',  source: 'Tables/Roma.jpg',               storage_path: 'tables/Roma.jpg',               colors: [] },
  { model_name: 'Solo Coffee Table',  category: 'Coffee Table',  source: 'Tables/Solo Coffee Table.jpg',  storage_path: 'tables/Solo Coffee Table.jpg',  colors: [] },
  { model_name: 'Solo Dining Table',  category: 'Dining Table',  source: 'Tables/Solo Dining Table.jpg',  storage_path: 'tables/Solo Dining Table.jpg',  colors: [] },
  { model_name: 'Solo TV Table',      category: 'TV Table',      source: 'Tables/Solo Tv table.jpg',      storage_path: 'tables/Solo Tv table.jpg',      colors: [] },
]

function getMimeType(filename: string): string {
  return 'image/jpeg'
}

async function optimizeProductImage(filePath: string): Promise<Buffer> {
  return sharp(filePath)
    .rotate()
    .resize({
      width: 1600,
      height: 1200,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({
      quality: 82,
      mozjpeg: true,
    })
    .toBuffer()
}

function storagePathFor(sourcePath: string): string {
  return sourcePath.replace(/\.(webp|png|jpe?g)$/i, '.jpg')
}

async function main() {
  console.log(`Seeding ${PRODUCTS.length} products...\n`)
  let success = 0
  let failed = 0

  for (const product of PRODUCTS) {
    const filePath = path.join(IMAGES_BASE, product.source)

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠  File not found: ${filePath}`)
      failed++
      continue
    }

    const fileBuffer = await optimizeProductImage(filePath)
    const storagePath = storagePathFor(product.storage_path)
    const mimeType = getMimeType(storagePath)

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        cacheControl: '31536000',
        upsert: true,
      })

    if (uploadError) {
      console.error(`✗ Upload failed for ${product.model_name}: ${uploadError.message}`)
      failed++
      continue
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(storagePath)

    // Upsert product row
    const { error: upsertError } = await supabase
      .from('products')
      .upsert(
        {
          model_name: product.model_name,
          category: product.category,
          default_image_url: publicUrl,
          colors: product.colors,
          is_active: true,
        },
        { onConflict: 'model_name' }
      )

    if (upsertError) {
      console.error(`✗ DB upsert failed for ${product.model_name}: ${upsertError.message}`)
      failed++
      continue
    }

    console.log(`✓ ${product.model_name} (${product.category})`)
    success++
  }

  console.log(`\nDone: ${success} succeeded, ${failed} failed`)
}

main().catch(err => { console.error(err); process.exit(1) })
