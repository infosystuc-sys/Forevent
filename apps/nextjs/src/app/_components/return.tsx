"use client"

import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'

export default function Return({ text, href }: { text?: string, href?: string }) {
  const router = useRouter()
  return (
    <Button className="text-blue-500" variant={"link"} onClick={() => {
      if (href) {
        router.push(href)
      } else {
        router.back()
      }
    }}>
      <ChevronLeft className="h-4 w-4" /> {text ?? "Volver"}
    </Button>
  )
}
