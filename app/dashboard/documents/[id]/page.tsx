"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface DocumentPageProps {
  params: {
    id: string
  }
}

export default function DocumentPage({ params }: DocumentPageProps) {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the editor with the document ID
    router.replace(`/dashboard/editor?id=${params.id}`)
  }, [params.id, router])

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="text-lg">Redirigiendo al editor...</div>
      </div>
    </div>
  )
}
