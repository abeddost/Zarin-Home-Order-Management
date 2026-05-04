const BASE = 'https://jeegxtsfxfatpksbjbaw.supabase.co/storage/v1/object/public/product-images'

export const PRODUCT_IMAGE_MAP: Record<string, string> = {
  'Almira L':           `${BASE}/sofas/Almira L.jpg`,
  'Almira':             `${BASE}/sofas/Almira.jpg`,
  'Angel':              `${BASE}/sofas/Angel.jpg`,
  'Avanos':             `${BASE}/sofas/Avanos.jpg`,
  'Belinda':            `${BASE}/sofas/Belinda.jpg`,
  'Bella':              `${BASE}/sofas/Bella.jpg`,
  'Bonita':             `${BASE}/sofas/Bonita.jpg`,
  'Bravo L':            `${BASE}/sofas/Bravo L.jpg`,
  'Dream':              `${BASE}/sofas/Dream.jpg`,
  'Lucas':              `${BASE}/sofas/Lucas.jpg`,
  'Luna':               `${BASE}/sofas/Luna.jpg`,
  'Motto':              `${BASE}/sofas/Motto.jpg`,
  'Pablo L':            `${BASE}/sofas/Pablo L.jpg`,
  'Puma':               `${BASE}/sofas/Puma.jpg`,
  'Tetra':              `${BASE}/sofas/Tetra.jpg`,
  'Toscana':            `${BASE}/sofas/Toscana.jpg`,
  'Verona':             `${BASE}/sofas/Verona.jpg`,
  'Bien':               `${BASE}/tables/Bien.jpg`,
  'Gucci Coffee Table': `${BASE}/tables/Gucci Coffee Table.jpg`,
  'Gucci Dining Table': `${BASE}/tables/Gucci Dining Table.jpg`,
  'Gucci Side Table':   `${BASE}/tables/Gucci Side table.jpg`,
  'Gucci TV Table':     `${BASE}/tables/Gucci TV table.jpeg`,
  'Puma Table':         `${BASE}/tables/Puma.jpg`,
  'Ravien':             `${BASE}/tables/Ravien.jpeg`,
  'Roma':               `${BASE}/tables/Roma.jpg`,
  'Solo Coffee Table':  `${BASE}/tables/Solo Coffee Table.jpg`,
  'Solo Dining Table':  `${BASE}/tables/Solo Dining Table.jpg`,
  'Solo TV Table':      `${BASE}/tables/Solo Tv table.jpg`,
}

export function getProductImage(modelName: string, dbUrl?: string | null): string {
  const url = dbUrl ?? PRODUCT_IMAGE_MAP[modelName]
  return url ? encodeURI(url) : '/placeholder-product.svg'
}

export const PRODUCT_IMAGE_SIZES = {
  thumb: '80px',
  picker: '(max-width: 640px) 33vw, 160px',
  card: '(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 220px',
}
