"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bell, Check, X, ExternalLink } from "lucide-react"
import { NotificationService } from "@/lib/notification-service"
import Link from "next/link"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  timestamp: Date
  read: boolean
  action?: {
    label: string
    url: string
  }
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const notificationService = NotificationService.getInstance()

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(setNotifications)

    // Request notification permission
    notificationService.requestPermission()

    // Start productivity reminders
    notificationService.scheduleProductivityReminders()

    return unsubscribe
  }, [])

  const unreadCount = notificationService.getUnreadCount()

  const markAsRead = (id: string) => {
    notificationService.markAsRead(id)
  }

  const deleteNotification = (id: string) => {
    notificationService.deleteNotification(id)
  }

  const markAllAsRead = () => {
    notificationService.markAllAsRead()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return "✅"
      case "warning":
        return "⚠️"
      case "error":
        return "❌"
      default:
        return "💡"
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  <Check className="w-4 h-4 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {notifications.length > 0 ? (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b hover:bg-gray-50 transition-colors ${
                        !notification.read ? "bg-blue-50 border-l-4 border-l-primary" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm">{getNotificationIcon(notification.type)}</span>
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{formatTime(notification.timestamp)}</span>
                            {notification.action && (
                              <Link href={notification.action.url} onClick={() => setIsOpen(false)}>
                                <Button variant="ghost" size="sm" className="text-xs h-6">
                                  {notification.action.label}
                                  <ExternalLink className="w-3 h-3 ml-1" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No notifications yet</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
