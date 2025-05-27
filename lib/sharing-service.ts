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
      console.log("🔄 Starting shareDocument:", { documentId, email: email.trim(), permission })

      // Verificar que el documento existe y pertenece al usuario actual
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("Usuario no autenticado")
      }

      console.log("👤 Current user:", user.id)

      // Usar la función RPC para verificar que el documento es accesible y es propio
      const { data: accessibleDocs, error: accessError } = await supabase.rpc("get_accessible_documents", {
        uid: user.id,
      })

      if (accessError) {
        console.error("❌ Error checking document access:", accessError)
        throw new Error("Error al verificar acceso al documento")
      }

      console.log("📄 Accessible documents:", accessibleDocs?.length || 0)

      const document = accessibleDocs?.find((doc: any) => doc.id === documentId && doc.user_id === user.id)
      if (!document) {
        console.error("❌ Document not found or not owned by user")
        throw new Error("Documento no encontrado o no tienes permisos para compartirlo")
      }

      console.log("✅ Document found and owned by user")

      // Buscar usuario por email en la tabla profiles
      const trimmedEmail = email.trim().toLowerCase()
      console.log("🔍 Searching for user with email:", trimmedEmail)

      // First, let's try a simple query to see if we can access profiles at all
      console.log("🧪 Testing profiles table access...")
      const { data: testProfiles, error: testError } = await supabase.from("profiles").select("id, email").limit(1)

      if (testError) {
        console.error("❌ Cannot access profiles table:", testError)
        throw new Error("Error de permisos al acceder a la tabla de usuarios")
      }

      console.log("✅ Profiles table accessible, sample:", testProfiles)

      // Now try the specific email search
      console.log("🔍 Searching for specific email...")
      const { data: profiles, error: userError } = await supabase
        .from("profiles")
        .select("id, email")
        .ilike("email", trimmedEmail)

      console.log("📊 Query result:", { profiles, userError })

      if (userError) {
        console.error("❌ Error finding user:", userError)
        throw new Error("Error al buscar el usuario")
      }

      console.log("👥 Found profiles:", profiles)

      if (!profiles || profiles.length === 0) {
        console.error("❌ No user found with email:", trimmedEmail)

        // Let's try an exact match instead of ilike
        console.log("🔍 Trying exact match...")
        const { data: exactProfiles, error: exactError } = await supabase
          .from("profiles")
          .select("id, email")
          .eq("email", trimmedEmail)

        console.log("📊 Exact match result:", { exactProfiles, exactError })

        if (!exactProfiles || exactProfiles.length === 0) {
          // Let's try the original case
          console.log("🔍 Trying original case...")
          const { data: originalProfiles, error: originalError } = await supabase
            .from("profiles")
            .select("id, email")
            .eq("email", email.trim())

          console.log("📊 Original case result:", { originalProfiles, originalError })

          if (!originalProfiles || originalProfiles.length === 0) {
            throw new Error("Usuario no encontrado. Asegúrate de que el email esté registrado.")
          } else {
            console.log("✅ Found user with original case")
            const targetUserId = originalProfiles[0].id
            console.log("🎯 Target user ID:", targetUserId)
            return await this.createShare(documentId, targetUserId, permission, email, user.id)
          }
        } else {
          console.log("✅ Found user with exact match")
          const targetUserId = exactProfiles[0].id
          console.log("🎯 Target user ID:", targetUserId)
          return await this.createShare(documentId, targetUserId, permission, email, user.id)
        }
      }

      const targetUserId = profiles[0].id
      console.log("🎯 Target user ID:", targetUserId)

      return await this.createShare(documentId, targetUserId, permission, email, user.id)
    } catch (error) {
      console.error("💥 Error in shareDocument:", error)
      if (error instanceof Error) {
        return {
          success: false,
          message: error.message,
        }
      }
      return {
        success: false,
        message: "Error inesperado al compartir el documento",
      }
    }
  }

  private async createShare(
    documentId: string,
    targetUserId: string,
    permission: "read" | "write",
    email: string,
    currentUserId: string,
  ) {
    // Verificar que no se está compartiendo consigo mismo
    if (targetUserId === currentUserId) {
      console.error("❌ User trying to share with themselves")
      throw new Error("No puedes compartir un documento contigo mismo")
    }

    // Verificar si ya está compartido
    console.log("🔍 Checking for existing share...")
    const { data: existingShare, error: existingError } = await supabase
      .from("shared_documents")
      .select("*")
      .eq("document_id", documentId)
      .eq("shared_with_user_id", targetUserId)
      .maybeSingle()

    if (existingError) {
      console.error("❌ Error checking existing share:", existingError)
      throw new Error("Error al verificar compartidos existentes")
    }

    console.log("📋 Existing share:", existingShare)

    if (existingShare) {
      // Actualizar permisos si ya existe
      console.log("🔄 Updating existing share permissions...")
      const { error: updateError } = await supabase
        .from("shared_documents")
        .update({ permission })
        .eq("id", existingShare.id)

      if (updateError) {
        console.error("❌ Error updating share:", updateError)
        throw new Error("Error al actualizar los permisos")
      }

      console.log("✅ Share updated successfully")
      return {
        success: true,
        message: `Permisos actualizados para ${email}`,
      }
    } else {
      // Crear nuevo compartido
      console.log("➕ Creating new share...")
      const { error: shareError } = await supabase.from("shared_documents").insert({
        document_id: documentId,
        shared_with_user_id: targetUserId,
        permission,
      })

      if (shareError) {
        console.error("❌ Error creating share:", shareError)
        throw new Error("Error al compartir el documento")
      }

      console.log("✅ Document shared successfully")
    }

    // Marcar documento como compartido
    console.log("🏷️ Marking document as shared...")
    const { error: updateDocError } = await supabase.from("documents").update({ shared: true }).eq("id", documentId)

    if (updateDocError) {
      console.error("⚠️ Error updating document shared status:", updateDocError)
      // No lanzar error, el compartido ya se creó
    }

    console.log("🎉 Share process completed successfully")
    return {
      success: true,
      message: `Documento compartido exitosamente con ${email}`,
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
            const { data: profiles, error: profileError } = await supabase
              .from("profiles")
              .select("email, full_name")
              .eq("id", share.shared_with_user_id)
              .limit(1)

            if (profileError) {
              console.error("Error fetching profile for share:", profileError)
              return {
                ...share,
                user_email: "Usuario no encontrado",
                user_name: "N/A",
              }
            }

            // Handle case where no profile is found or multiple profiles exist
            const profile = profiles && profiles.length > 0 ? profiles[0] : null

            if (!profile) {
              console.warn("No profile found for user ID:", share.shared_with_user_id)
              return {
                ...share,
                user_email: "Usuario no encontrado",
                user_name: "N/A",
              }
            }

            return {
              ...share,
              user_email: profile.email,
              user_name: profile.full_name || profile.email,
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

  // Esta función ya no es necesaria porque get_accessible_documents maneja todo
  async getSharedDocuments(userId: string): Promise<SharedDocument[]> {
    console.log("⚠️ getSharedDocuments is deprecated. Use get_accessible_documents RPC instead.")
    return []
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

      // Usar la función RPC para obtener documentos accesibles
      const { data: accessibleDocs, error } = await supabase.rpc("get_accessible_documents", {
        uid: user.id,
      })

      if (error) {
        console.error("Error fetching accessible documents:", error)
        return null
      }

      const document = accessibleDocs?.find((doc: any) => doc.id === documentId)
      if (!document) {
        console.log("Document not accessible to user")
        return null
      }

      // Si es el propietario
      if (document.user_id === user.id) {
        console.log("User is owner")
        return "owner"
      }

      // Si es compartido, verificar permisos
      const { data: share, error: shareError } = await supabase
        .from("shared_documents")
        .select("permission")
        .eq("document_id", documentId)
        .eq("shared_with_user_id", user.id)
        .maybeSingle()

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

  async updatePermission(shareId: string, newPermission: "view" | "edit") {
    try {
      const permission = newPermission === "edit" ? "write" : "read"

      const { error } = await supabase.from("shared_documents").update({ permission }).eq("id", shareId)

      if (error) {
        console.error("Error updating permission:", error)
        return {
          success: false,
          message: "Error al actualizar permisos",
        }
      }

      return {
        success: true,
        message: "Permisos actualizados exitosamente",
      }
    } catch (error) {
      console.error("Error in updatePermission:", error)
      return {
        success: false,
        message: "Error inesperado al actualizar permisos",
      }
    }
  }

  async revokeAccess(shareId: string) {
    try {
      const { error } = await supabase.from("shared_documents").delete().eq("id", shareId)

      if (error) {
        console.error("Error revoking access:", error)
        return {
          success: false,
          message: "Error al revocar acceso",
        }
      }

      return {
        success: true,
        message: "Acceso revocado exitosamente",
      }
    } catch (error) {
      console.error("Error in revokeAccess:", error)
      return {
        success: false,
        message: "Error inesperado al revocar acceso",
      }
    }
  }

  async removeShare(shareId: string) {
    return this.revokeAccess(shareId)
  }
}
