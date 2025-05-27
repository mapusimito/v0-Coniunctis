"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NewDocumentPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the editor without an ID to create a new document
    router.replace("/dashboard/editor")
  }, [router])

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="text-lg">Creando nuevo documento...</div>
      </div>
    </div>
  )
}
