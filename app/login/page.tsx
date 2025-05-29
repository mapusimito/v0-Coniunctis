"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useTheme } from "next-themes"
import { useIsMobile } from "@/hooks/use-mobile"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<"signin" | "signup">("signin")
  const router = useRouter()
  const { signIn, signUp, user } = useAuth()
  const { resolvedTheme } = useTheme()
  const isMobile = useIsMobile()

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const logoSrc = resolvedTheme === "dark" ? "/images/coniunctis-logo-dark.png" : "/images/coniunctis-logo-light.png"

  // Vista móvil compacta
  if (isMobile) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-2 ${resolvedTheme === "dark" ? "bg-black" : "bg-white"}`}>
        <div className="w-full max-w-xs animate-fade-in">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            {mounted && (
              <Image
                src={logoSrc || "/placeholder.svg"}
                alt="Coniunctis Logo"
                width={160}
                height={48}
                priority
                className="h-auto"
              />
            )}
          </div>
          <Card className="modern-card shadow-modern-lg bg-background dark:bg-zinc-900">
            <CardHeader className="text-center space-y-1">
              <CardTitle className="text-lg font-bold text-foreground">
                {tab === "signin" ? "Bienvenido de vuelta" : "¡Únete a nosotros!"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {tab === "signin"
                  ? "Inicia sesión para seguir construyendo tus proyectos."
                  : "Crea una cuenta para comenzar a potenciar tu productividad."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 animate-scale-in">
                  <AlertDescription className="text-red-800 dark:text-red-300 text-xs">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 animate-scale-in">
                  <AlertDescription className="text-green-800 dark:text-green-300 text-xs">{success}</AlertDescription>
                </Alert>
              )}

              <Tabs
                defaultValue="signin"
                className="w-full"
                value={tab}
                onValueChange={(value) => setTab(value as "signin" | "signup")}
              >
                <TabsList className="grid w-full grid-cols-2 bg-muted rounded-lg text-xs">
                  <TabsTrigger value="signin" className="rounded-lg">
                    Iniciar sesión
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-lg">
                    Crear cuenta
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="space-y-3 mt-4">
                  <form onSubmit={handleSignIn} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-xs font-medium text-foreground">
                        Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Ingresa tu email"
                        required
                        disabled={isLoading}
                        className="modern-input text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="password" className="text-xs font-medium text-foreground">
                        Contraseña
                      </Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Ingresa tu contraseña"
                        required
                        disabled={isLoading}
                        className="modern-input text-xs"
                      />
                    </div>

                    <div className="text-right">
                      <Link
                        href="/passwordsauth/changepwd"
                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </div>

                    <Button type="submit" className="w-full modern-button-primary text-xs py-2" disabled={isLoading}>
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

                <TabsContent value="signup" className="space-y-3 mt-4">
                  <form onSubmit={handleSignUp} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="name" className="text-xs font-medium text-foreground">
                        Nombre completo
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Ingresa tu nombre completo"
                        required
                        disabled={isLoading}
                        className="modern-input text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="email-signup" className="text-xs font-medium text-foreground">
                        Email
                      </Label>
                      <Input
                        id="email-signup"
                        name="email-signup"
                        type="email"
                        placeholder="Ingresa tu email"
                        required
                        disabled={isLoading}
                        className="modern-input text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="password-signup" className="text-xs font-medium text-foreground">
                        Contraseña
                      </Label>
                      <Input
                        id="password-signup"
                        name="password-signup"
                        type="password"
                        placeholder="Crea una contraseña (6 caracteres mínimo)"
                        required
                        disabled={isLoading}
                        minLength={6}
                        className="modern-input text-xs"
                      />
                    </div>
                    <Button type="submit" className="w-full modern-button-primary text-xs py-2" disabled={isLoading}>
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

              <div className="text-center">
                <Link
                  href="/"
                  className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Volver al inicio
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Vista escritorio (sin cambios)
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          {mounted && (
            <Image
              src={logoSrc || "/placeholder.svg"}
              alt="Coniunctis Logo"
              width={280}
              height={80}
              priority
              className="h-auto"
            />
          )}
        </div>

        <Card className="modern-card shadow-modern-lg">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-foreground">
              {tab === "signin" ? "Bienvenido de vuelta" : "¡Únete a nosotros!"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {tab === "signin"
                ? "Inicia sesión para seguir construyendo tus proyectos."
                : "Crea una cuenta para comenzar a potenciar tu productividad."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 animate-scale-in">
                <AlertDescription className="text-red-800 dark:text-red-300">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 animate-scale-in">
                <AlertDescription className="text-green-800 dark:text-green-300">{success}</AlertDescription>
              </Alert>
            )}

            <Tabs
              defaultValue="signin"
              className="w-full"
              value={tab}
              onValueChange={(value) => setTab(value as "signin" | "signup")}
            >
              <TabsList className="grid w-full grid-cols-2 bg-muted rounded-lg">
                <TabsTrigger value="signin" className="rounded-lg">
                  Iniciar sesión
                </TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg">
                  Crear cuenta
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4 mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Ingresa tu email"
                      required
                      disabled={isLoading}
                      className="modern-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-foreground">
                      Contraseña
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Ingresa tu contraseña"
                      required
                      disabled={isLoading}
                      className="modern-input"
                    />
                  </div>

                  <div className="text-right">
                    <Link
                      href="/passwordsauth/changepwd"
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  <Button type="submit" className="w-full modern-button-primary" disabled={isLoading}>
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

              <TabsContent value="signup" className="space-y-4 mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-foreground">
                      Nombre completo
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Ingresa tu nombre completo"
                      required
                      disabled={isLoading}
                      className="modern-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-signup" className="text-sm font-medium text-foreground">
                      Email
                    </Label>
                    <Input
                      id="email-signup"
                      name="email-signup"
                      type="email"
                      placeholder="Ingresa tu email"
                      required
                      disabled={isLoading}
                      className="modern-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup" className="text-sm font-medium text-foreground">
                      Contraseña
                    </Label>
                    <Input
                      id="password-signup"
                      name="password-signup"
                      type="password"
                      placeholder="Crea una contraseña (6 caracteres mínimo)"
                      required
                      disabled={isLoading}
                      minLength={6}
                      className="modern-input"
                    />
                  </div>
                  <Button type="submit" className="w-full modern-button-primary" disabled={isLoading}>
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

            <div className="text-center">
              <Link
                href="/"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver al inicio
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
