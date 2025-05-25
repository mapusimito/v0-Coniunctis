"use client"

import React from "react"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { NotificationCenter } from "@/components/notification-center"
import { ProtectedRoute } from "@/lib/protected-route"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname } from "next/navigation"

const getBreadcrumbs = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean)
  const breadcrumbs = []

  if (segments[1] === "dashboard" || segments.length === 1) {
    breadcrumbs.push({ label: "Inicio", href: "/dashboard" })
  }

  if (segments[1] === "documents") {
    breadcrumbs.push({ label: "Inicio", href: "/dashboard" })
    breadcrumbs.push({ label: "Documentos", href: "/dashboard/documents" })
  }

  if (segments[1] === "editor") {
    breadcrumbs.push({ label: "Inicio", href: "/dashboard" })
    breadcrumbs.push({ label: "Documentos", href: "/dashboard/documents" })
    breadcrumbs.push({ label: "Editor", href: "/dashboard/editor" })
  }

  if (segments[1] === "tasks") {
    breadcrumbs.push({ label: "Inicio", href: "/dashboard" })
    breadcrumbs.push({ label: "Tareas", href: "/dashboard/tasks" })
  }

  if (segments[1] === "pomodoro") {
    breadcrumbs.push({ label: "Inicio", href: "/dashboard" })
    breadcrumbs.push({ label: "Pomodoro", href: "/dashboard/pomodoro" })
  }

  if (segments[1] === "analytics") {
    breadcrumbs.push({ label: "Inicio", href: "/dashboard" })
    breadcrumbs.push({ label: "Analytics", href: "/dashboard/analytics" })
  }

  return breadcrumbs
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((breadcrumb, index) => (
                  <React.Fragment key={breadcrumb.href}>
                    <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={breadcrumb.href}>{breadcrumb.label}</BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && <BreadcrumbSeparator className="hidden md:block" />}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto">
              <NotificationCenter />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
