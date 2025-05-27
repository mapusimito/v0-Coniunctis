"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Share, Calendar, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabaseClient"
import { SharingService } from "@/lib/sharing-service"

interface Document {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  user_id: string
  shared: boolean
  source?: "owned" | "shared"
  permission?: string
  owner_email?: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()
  const sharingService = new SharingService()

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

      // Get owned documents
      console.log("📄 Fetching owned documents...")
      const { data: ownedDocs, error: ownedError } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

      if (ownedError) {
        console.error("❌ Error fetching owned documents:", ownedError)
        throw ownedError
      }

      console.log("✅ Owned documents:", ownedDocs?.length || 0)

      // Get shared documents
      console.log("🤝 Fetching shared documents...")
      const sharedDocs = await sharingService.getSharedDocuments(user.id)
      console.log("✅ Shared documents:", sharedDocs?.length || 0)

      // Combine documents
      const ownedWithSource = (ownedDocs || []).map((doc) => ({
        ...doc,
        source: "owned" as const,
      }))

      const sharedWithSource = (sharedDocs || []).map((doc) => ({
        ...doc,
        source: "shared" as const,
      }))

      const allDocuments = [...ownedWithSource, ...sharedWithSource]
      console.log("📋 Total documents:", allDocuments.length)
      console.log("📋 All documents:", allDocuments)

      setDocuments(allDocuments)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Manage your documents and collaborations</p>
        </div>
        <Button onClick={handleNewDocument} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Document
        </Button>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first document to get started with AI-powered writing assistance.
            </p>
            <Button onClick={handleNewDocument} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleDocumentClick(doc.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-1">{doc.title || "Untitled"}</CardTitle>
                  <div className="flex gap-1">
                    {doc.source === "shared" && (
                      <Badge variant="secondary" className="text-xs">
                        <Share className="w-3 h-3 mr-1" />
                        Shared
                      </Badge>
                    )}
                    {doc.permission && (
                      <Badge variant="outline" className="text-xs">
                        {doc.permission}
                      </Badge>
                    )}
                  </div>
                </div>
                {doc.source === "shared" && doc.owner_email && (
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <User className="w-3 h-3" />
                    by {doc.owner_email}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {doc.content ? doc.content.replace(/<[^>]*>/g, "").substring(0, 100) + "..." : "No content"}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(doc.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
