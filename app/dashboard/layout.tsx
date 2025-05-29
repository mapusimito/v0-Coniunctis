"use client"

import type React from "react"
import { ProtectedRoute } from "@/lib/protected-route"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { AuthProvider } from "@/lib/auth-context"
import { useIsMobile } from "@/hooks/use-mobile"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isMobile = useIsMobile()

  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className={`flex h-screen bg-background ${isMobile ? "flex-col" : ""}`}>
          <DashboardSidebar />
          <div className={`flex-1 flex flex-col overflow-hidden ${isMobile ? "p-2" : ""}`}>
            <main
              className={`flex-1 overflow-y-auto bg-background ${
                isMobile ? "p-2 text-sm gap-2" : "p-8"
              }`}
            >
              {children}
            </main>
          </div>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  )
}
