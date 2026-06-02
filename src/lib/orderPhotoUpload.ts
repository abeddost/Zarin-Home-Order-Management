'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/client'

const MAX_SOURCE_SIZE_BYTES = 25 * 1024 * 1024
const MAX_OUTPUT_DIMENSION = 1600
const JPEG_QUALITY = 0.8

function makeObjectUrl(file: File): string {
  return URL.createObjectURL(file)
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = makeObjectUrl(file)
    const image = new window.Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read this image. Please try another photo.'))
    }
    image.src = url
  })
}

function getOutputSize(width: number, height: number) {
  const scale = Math.min(1, MAX_OUTPUT_DIMENSION / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

async function optimizeOrderPhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file.')
  }

  if (file.size > MAX_SOURCE_SIZE_BYTES) {
    throw new Error('Image is too large. Please choose a photo under 25 MB.')
  }

  const image = await loadImage(file)
  const sourceWidth = image.naturalWidth || image.width
  const sourceHeight = image.naturalHeight || image.height

  if (!sourceWidth || !sourceHeight) {
    throw new Error('Could not read this image. Please try another photo.')
  }

  const { width, height } = getOutputSize(sourceWidth, sourceHeight)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Image optimization is not available in this browser.')
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) resolve(blob)
        else reject(new Error('Could not optimize this image. Please try another photo.'))
      },
      'image/jpeg',
      JPEG_QUALITY
    )
  })
}

function makeOrderPhotoPath(): string {
  const month = new Date().toISOString().slice(0, 7)
  const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `items/${month}/${id}.jpg`
}

export async function uploadOptimizedOrderPhoto(file: File): Promise<string> {
  const optimizedPhoto = await optimizeOrderPhoto(file)
  const path = makeOrderPhotoPath()
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase.storage
    .from('order-images')
    .upload(path, optimizedPhoto, {
      contentType: 'image/jpeg',
      upsert: false,
    })

  if (error) throw new Error(`Image upload failed: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage.from('order-images').getPublicUrl(data.path)
  return publicUrl
}
