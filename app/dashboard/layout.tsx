import type React from "react"
import { ProtectedRoute } from "@/lib/protected-route"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto">{children}</div>
      </div>
    </ProtectedRoute>
  )
}
