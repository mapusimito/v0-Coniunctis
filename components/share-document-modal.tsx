"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Share2, Mail, Eye, Edit, Trash2, Loader2, Users } from "lucide-react"
import { SharingService, type SharedDocument } from "@/lib/sharing-service"
import { useToast } from "@/hooks/use-toast"

interface ShareDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  documentTitle: string
  isOwner: boolean
}

export function ShareDocumentModal({ isOpen, onClose, documentId, documentTitle, isOwner }: ShareDocumentModalProps) {
  const [email, setEmail] = useState("")
  const [permission, setPermission] = useState<"view" | "edit">("view")
  const [isLoading, setIsLoading] = useState(false)
  const [shares, setShares] = useState<SharedDocument[]>([])
  const [loadingShares, setLoadingShares] = useState(false)
  const { toast } = useToast()
  const sharingService = SharingService.getInstance()

  // Load shares when modal opens
  useEffect(() => {
    if (isOpen && isOwner && documentId) {
      loadShares()
    }
  }, [isOpen, isOwner, documentId])

  const loadShares = async () => {
    if (!isOwner || !documentId) return

    setLoadingShares(true)
    try {
      console.log("Loading shares for document:", documentId)
      const documentShares = await sharingService.getDocumentShares(documentId)
      console.log("Loaded shares:", documentShares)
      setShares(documentShares)
    } catch (error) {
      console.error("Error loading shares:", error)
      toast({
        title: "Error",
        description: "Error al cargar la lista de usuarios compartidos",
        variant: "destructive",
      })
    } finally {
      setLoadingShares(false)
    }
  }

  const handleShare = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un email válido",
        variant: "destructive",
      })
      return
    }

    if (!documentId) {
      toast({
        title: "Error",
        description: "ID de documento no válido",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      console.log("Attempting to share document:", { documentId, email: email.trim(), permission })
      const result = await sharingService.shareDocument(documentId, email.trim(), permission)

      if (result.success) {
        toast({
          title: "¡Éxito!",
          description: result.message,
        })
        setEmail("")
        setPermission("view")
        await loadShares()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Unexpected error sharing document:", error)
      toast({
        title: "Error",
        description: "Error inesperado al compartir el documento",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePermission = async (shareId: string, newPermission: "view" | "edit") => {
    try {
      const result = await sharingService.updatePermission(shareId, newPermission)

      if (result.success) {
        toast({
          title: "¡Éxito!",
          description: result.message,
        })
        await loadShares()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar permisos",
        variant: "destructive",
      })
    }
  }

  const handleRevokeAccess = async (shareId: string) => {
    if (!confirm("¿Estás seguro de que quieres revocar el acceso a este usuario?")) {
      return
    }

    try {
      const result = await sharingService.revokeAccess(shareId)

      if (result.success) {
        toast({
          title: "¡Éxito!",
          description: result.message,
        })
        await loadShares()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al revocar acceso",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modern-card max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-primary" />
            <span>Compartir documento</span>
          </DialogTitle>
          <DialogDescription>Comparte "{documentTitle}" con otros usuarios registrados</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulario para compartir (solo para dueños) */}
          {isOwner && (
            <Card className="modern-card">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email del usuario
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permission" className="text-sm font-medium">
                    Permisos
                  </Label>
                  <Select value={permission} onValueChange={(value: "view" | "edit") => setPermission(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">
                        <div className="flex items-center space-x-2">
                          <Eye className="w-4 h-4" />
                          <span>Solo lectura</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="edit">
                        <div className="flex items-center space-x-2">
                          <Edit className="w-4 h-4" />
                          <span>Puede editar</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleShare} disabled={isLoading} className="w-full modern-button-primary">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Compartiendo...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartir documento
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Lista de usuarios con acceso */}
          {isOwner && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Usuarios con acceso</h3>
              </div>

              {loadingShares ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : shares.length === 0 ? (
                <Card className="modern-card">
                  <CardContent className="p-4 text-center text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Este documento no está compartido con nadie</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {shares.map((share) => (
                    <Card key={share.id} className="modern-card">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <Mail className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{share.user_name}</p>
                              <p className="text-xs text-muted-foreground">{share.user_email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Select
                              value={share.permission}
                              onValueChange={(value: "view" | "edit") => handleUpdatePermission(share.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="view">
                                  <div className="flex items-center space-x-2">
                                    <Eye className="w-4 h-4" />
                                    <span>Lectura</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="edit">
                                  <div className="flex items-center space-x-2">
                                    <Edit className="w-4 h-4" />
                                    <span>Edición</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeAccess(share.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Vista para usuarios con acceso compartido */}
          {!isOwner && (
            <Card className="modern-card">
              <CardContent className="p-4 text-center">
                <Share2 className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Este documento ha sido compartido contigo</p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
