import { supabase } from "@/lib/supabaseClient"

export interface DocumentShare {
  id: string
  document_id: string
  shared_with_user_id: string
  permission: "read" | "write"
  created_at: string
  user_email?: string
  user_name?: string
}

export interface SharedDocument {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  user_id: string
  shared: boolean
  source: "shared"
  owner_email?: string
  permission?: string
}

export class SharingService {
  private static instance: SharingService

  private constructor() {}

  static getInstance(): SharingService {
    if (!SharingService.instance) {
      SharingService.instance = new SharingService()
    }
    return SharingService.instance
  }

  async shareDocument(documentId: string, email: string, permission: "read" | "write" = "read") {
    try {
      console.log("Sharing document:", { documentId, email, permission })

      // Verificar que el documento existe y pertenece al usuario actual
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("Usuario no autenticado")
      }

      const { data: document, error: docError } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .eq("user_id", user.id)
        .single()

      if (docError || !document) {
        console.error("Document not found or not owned by user:", docError)
        throw new Error("Documento no encontrado o no tienes permisos")
      }

      // Buscar usuario por email usando la función SQL
      const { data: targetUserId, error: userError } = await supabase.rpc("get_user_by_email", {
        user_email: email,
      })

      if (userError) {
        console.error("Error finding user:", userError)
        throw new Error("Error al buscar el usuario")
      }

      if (!targetUserId) {
        throw new Error("Usuario no encontrado. Asegúrate de que el email esté registrado.")
      }

      console.log("Target user ID:", targetUserId)

      // Verificar si ya está compartido
      const { data: existingShare } = await supabase
        .from("shared_documents")
        .select("*")
        .eq("document_id", documentId)
        .eq("shared_with_user_id", targetUserId)
        .single()

      if (existingShare) {
        // Actualizar permisos si ya existe
        const { error: updateError } = await supabase
          .from("shared_documents")
          .update({ permission })
          .eq("id", existingShare.id)

        if (updateError) {
          console.error("Error updating share:", updateError)
          throw new Error("Error al actualizar los permisos")
        }

        console.log("Share updated successfully")
      } else {
        // Crear nuevo compartido
        const { error: shareError } = await supabase.from("shared_documents").insert({
          document_id: documentId,
          shared_with_user_id: targetUserId,
          permission,
        })

        if (shareError) {
          console.error("Error creating share:", shareError)
          throw new Error("Error al compartir el documento")
        }

        console.log("Document shared successfully")
      }

      // Marcar documento como compartido
      const { error: updateDocError } = await supabase.from("documents").update({ shared: true }).eq("id", documentId)

      if (updateDocError) {
        console.error("Error updating document shared status:", updateDocError)
        // No lanzar error, el compartido ya se creó
      }

      return { success: true }
    } catch (error) {
      console.error("Error in shareDocument:", error)
      throw error
    }
  }

  async getDocumentShares(documentId: string): Promise<DocumentShare[]> {
    try {
      console.log("Getting shares for document:", documentId)

      const { data: shares, error } = await supabase
        .from("shared_documents")
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching shares:", error)
        throw new Error("Error al obtener los compartidos")
      }

      console.log("Raw shares:", shares)

      // Obtener detalles de usuarios para cada share
      const sharesWithUserDetails = await Promise.all(
        (shares || []).map(async (share) => {
          try {
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("email, full_name")
              .eq("id", share.shared_with_user_id)
              .single()

            if (profileError) {
              console.error("Error fetching profile for share:", profileError)
              return {
                ...share,
                user_email: "Usuario no encontrado",
                user_name: "N/A",
              }
            }

            return {
              ...share,
              user_email: profile.email,
              user_name: profile.full_name,
            }
          } catch (error) {
            console.error("Error processing share:", error)
            return {
              ...share,
              user_email: "Error",
              user_name: "Error",
            }
          }
        }),
      )

      console.log("Shares with user details:", sharesWithUserDetails)
      return sharesWithUserDetails
    } catch (error) {
      console.error("Error in getDocumentShares:", error)
      throw error
    }
  }

  async getSharedDocuments(userId: string): Promise<SharedDocument[]> {
    try {
      console.log("🤝 Getting shared documents for user:", userId)

      // Primero obtener los shares del usuario
      const { data: shares, error: sharesError } = await supabase
        .from("shared_documents")
        .select("*")
        .eq("shared_with_user_id", userId)
        .order("created_at", { ascending: false })

      if (sharesError) {
        console.error("❌ Error fetching shares:", sharesError)
        throw new Error("Error al obtener documentos compartidos")
      }

      console.log("📋 User shares:", shares)

      if (!shares || shares.length === 0) {
        console.log("ℹ️ No shares found for user")
        return []
      }

      // Obtener los IDs de documentos
      const documentIds = shares.map((share) => share.document_id)
      console.log("📄 Document IDs to fetch:", documentIds)

      // Obtener los documentos
      const { data: documents, error: docsError } = await supabase
        .from("documents")
        .select("*")
        .in("id", documentIds)
        .order("updated_at", { ascending: false })

      if (docsError) {
        console.error("❌ Error fetching documents:", docsError)
        throw new Error("Error al obtener documentos")
      }

      console.log("📄 Fetched documents:", documents)

      if (!documents || documents.length === 0) {
        console.log("ℹ️ No documents found for the shared IDs")
        return []
      }

      // Procesar documentos y obtener información del propietario
      const processedDocs = await Promise.all(
        documents.map(async (doc) => {
          try {
            // Encontrar el share correspondiente para obtener los permisos
            const shareData = shares.find((share) => share.document_id === doc.id)

            // Obtener email del propietario
            const { data: owner, error: ownerError } = await supabase
              .from("profiles")
              .select("email")
              .eq("id", doc.user_id)
              .single()

            const ownerEmail = ownerError ? "Propietario desconocido" : owner.email

            return {
              id: doc.id,
              title: doc.title,
              content: doc.content,
              created_at: doc.created_at,
              updated_at: doc.updated_at,
              user_id: doc.user_id,
              shared: doc.shared,
              source: "shared" as const,
              owner_email: ownerEmail,
              permission: shareData?.permission || "read",
            }
          } catch (error) {
            console.error("❌ Error processing shared document:", error)
            return null
          }
        }),
      )

      // Filtrar documentos nulos
      const validDocs = processedDocs.filter((doc) => doc !== null) as SharedDocument[]
      console.log("✅ Processed shared documents:", validDocs)
      return validDocs
    } catch (error) {
      console.error("❌ Error in getSharedDocuments:", error)
      throw error
    }
  }

  async getDocumentPermission(documentId: string): Promise<"owner" | "edit" | "view" | null> {
    try {
      console.log("Getting document permission for:", documentId)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.log("No authenticated user")
        return null
      }

      // Primero verificar si es el propietario
      const { data: document, error: docError } = await supabase
        .from("documents")
        .select("user_id")
        .eq("id", documentId)
        .single()

      if (docError) {
        console.error("Error fetching document:", docError)
        return null
      }

      if (!document) {
        console.log("Document not found")
        return null
      }

      // Si es el propietario
      if (document.user_id === user.id) {
        console.log("User is owner")
        return "owner"
      }

      // Verificar si está compartido con el usuario
      const { data: share, error: shareError } = await supabase
        .from("shared_documents")
        .select("permission")
        .eq("document_id", documentId)
        .eq("shared_with_user_id", user.id)
        .single()

      if (shareError) {
        console.error("Error fetching share:", shareError)
        return null
      }

      if (!share) {
        console.log("Document not shared with user")
        return null
      }

      // Convertir permisos de la base de datos al formato esperado
      const permission = share.permission === "write" ? "edit" : "view"
      console.log("User has permission:", permission)
      return permission
    } catch (error) {
      console.error("Error in getDocumentPermission:", error)
      return null
    }
  }

  async removeShare(shareId: string) {
    try {
      const { error } = await supabase.from("shared_documents").delete().eq("id", shareId)

      if (error) {
        console.error("Error removing share:", error)
        throw new Error("Error al eliminar el compartido")
      }

      return { success: true }
    } catch (error) {
      console.error("Error in removeShare:", error)
      throw error
    }
  }
}
