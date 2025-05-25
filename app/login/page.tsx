"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const { signIn, signUp, user } = useAuth()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.target as HTMLFormElement)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const { data, error } = await signIn(email, password)

    if (error) {
      setError(error.message)
    } else {
      router.push("/dashboard")
    }

    setIsLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.target as HTMLFormElement)
    const email = formData.get("email-signup") as string
    const password = formData.get("password-signup") as string
    const fullName = formData.get("name") as string

    const { data, error } = await signUp(email, password, fullName)

    if (error) {
      setError(error.message)
    } else {
      setSuccess("¡Cuenta creada exitosamente! Por favor revisa tu correo electrónico para verificar tu cuenta.")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Coniunctis
          </span>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Bienvenido de vuelta</CardTitle>
            <CardDescription>Inicia sesión para seguir construyendo tus proyectos.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Iniciar sesión</TabsTrigger>
                <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Ingresa tu email"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Ingresa tu contraseña"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {/* ⬇️ Aquí agregamos el botón de "¿Olvidaste tu contraseña?" */}
                  <div className="text-right">
                    <Link
                      href="/dashboard/resetear-contraseña"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Iniciando sesión...
                      </>
                    ) : (
                      "Iniciar sesión"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Ingresa tu nombre completo"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-signup">Email</Label>
                    <Input
                      id="email-signup"
                      name="email-signup"
                      type="email"
                      placeholder="Ingresa tu email"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup">Contraseña</Label>
                    <Input
                      id="password-signup"
                      name="password-signup"
                      type="password"
                      placeholder="Crea una contraseña (6 caracteres mínimo)"
                      required
                      disabled={isLoading}
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        Creando cuenta...
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      </>
                    ) : (
                      "Crear cuenta"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-gray-600 hover:text-primary transition-colors">
                ← 
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
