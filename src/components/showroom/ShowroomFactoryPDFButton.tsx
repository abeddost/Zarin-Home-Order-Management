'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Factory, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { generateShowroomFactoryPDF } from '@/lib/pdf/generateShowroomFactoryPDF'

function openBase64PDF(base64: string, filename: string) {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

export function ShowroomFactoryPDFButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateShowroomFactoryPDF(orderId)
      if (result.error) { toast.error('PDF failed: ' + result.error); return }
      openBase64PDF(result.base64!, result.filename!)
      toast.success('Factory PDF downloaded')
    })
  }

  return (
    <Button variant="outline" onClick={handleGenerate} disabled={isPending}>
      {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Factory className="w-4 h-4 mr-2" />}
      Factory PDF
    </Button>
  )
}
