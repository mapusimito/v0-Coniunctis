"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, FileText, Calendar } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabaseClient"

interface Document {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  user_id: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      fetchDocuments()
    }
  }, [user])

  const fetchDocuments = async () => {
    if (!user) {
      console.log("❌ No user found")
      return
    }

    try {
      console.log("🔍 Starting document fetch for user:", user.email)
      setLoading(true)

      // Obtener documentos del usuario
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

      if (error) {
        console.error("❌ Error fetching documents:", error)
        throw error
      }

      console.log("✅ Documents fetched:", data?.length || 0)
      setDocuments(data || [])
    } catch (error) {
      console.error("❌ Error fetching documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentClick = (documentId: string) => {
    router.push(`/dashboard/editor?id=${documentId}`)
  }

  const handleNewDocument = () => {
    router.push("/dashboard/editor")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getDocumentPreview = (content: string) => {
    try {
      const parsed = JSON.parse(content)
      const firstChild = parsed?.root?.children?.[0]
      if (firstChild?.children?.[0]?.text) {
        return firstChild.children[0].text.substring(0, 100) + "..."
      }
    } catch (e) {
      // Si no es JSON válido, mostrar texto plano
      return content.substring(0, 100) + "..."
    }
    return "Sin contenido"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando documentos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mis Documentos</h1>
          <p className="text-muted-foreground">Gestiona tus documentos</p>
          {user && <p className="text-sm text-muted-foreground mt-1">Usuario: {user.email}</p>}
        </div>
        <Button onClick={handleNewDocument} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Documento
        </Button>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay documentos</h3>
            <p className="text-muted-foreground text-center mb-4">Comienza creando tu primer documento.</p>
            <Button onClick={handleNewDocument} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Crear Documento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{doc.title || "Sin título"}</CardTitle>
                    <CardDescription className="mt-2">{getDocumentPreview(doc.content)}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(doc.created_at)}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(doc.updated_at)}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => handleDocumentClick(doc.id)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Abrir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
