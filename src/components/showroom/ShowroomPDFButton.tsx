'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { generateShowroomPDF } from '@/lib/pdf/generateShowroomPDF'

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

export function ShowroomPDFButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateShowroomPDF(orderId)
      if (result.error) { toast.error('PDF failed: ' + result.error); return }
      openBase64PDF(result.base64!, result.filename!)
      toast.success('PDF downloaded')
    })
  }

  return (
    <Button variant="outline" onClick={handleGenerate} disabled={isPending}>
      {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
      Download PDF
    </Button>
  )
}
