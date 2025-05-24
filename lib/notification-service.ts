import { generateProductivityInsight, generateWeeklySummary } from "@/app/actions/ai-actions"

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

export class NotificationService {
  private static instance: NotificationService
  private notifications: Notification[] = []
  private listeners: ((notifications: Notification[]) => void)[] = []

  private constructor() {
    this.loadNotifications()
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  private loadNotifications() {
    const stored = localStorage.getItem("coniunctis-notifications")
    if (stored) {
      this.notifications = JSON.parse(stored).map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp),
      }))
    }
  }

  private saveNotifications() {
    localStorage.setItem("coniunctis-notifications", JSON.stringify(this.notifications))
    this.notifyListeners()
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.notifications))
  }

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener)
    listener(this.notifications) // Initial call

    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  addNotification(notification: Omit<Notification, "id" | "timestamp" | "read">) {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    }

    this.notifications.unshift(newNotification)
    this.saveNotifications()

    // Show browser notification if permission granted
    if (Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
      })
    }
  }

  markAsRead(id: string) {
    const notification = this.notifications.find((n) => n.id === id)
    if (notification) {
      notification.read = true
      this.saveNotifications()
    }
  }

  markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true))
    this.saveNotifications()
  }

  deleteNotification(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id)
    this.saveNotifications()
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length
  }

  // AI-powered productivity insights using server actions
  async generateProductivityInsight(userStats: any) {
    try {
      const insight = await generateProductivityInsight(userStats)

      this.addNotification({
        title: "🧠 AI Productivity Insight",
        message: insight,
        type: "info",
        action: {
          label: "View Analytics",
          url: "/dashboard/analytics",
        },
      })
    } catch (error) {
      console.error("Failed to generate AI insight:", error)
    }
  }

  // Smart break reminders based on activity
  scheduleSmartBreakReminder(activityLevel: "low" | "medium" | "high") {
    const messages = {
      low: "You've been inactive for a while. How about starting a quick task or taking a walk?",
      medium: "Great work! Consider taking a 5-minute break to recharge.",
      high: "You're on fire! 🔥 Don't forget to take breaks to maintain your productivity.",
    }

    const intervals = {
      low: 45 * 60 * 1000, // 45 minutes
      medium: 25 * 60 * 1000, // 25 minutes (Pomodoro)
      high: 20 * 60 * 1000, // 20 minutes
    }

    setTimeout(() => {
      this.addNotification({
        title: "⏰ Smart Break Reminder",
        message: messages[activityLevel],
        type: "info",
        action: {
          label: "Start Break Timer",
          url: "/dashboard/pomodoro",
        },
      })
    }, intervals[activityLevel])
  }

  // Goal achievement celebrations
  celebrateGoalAchievement(goalType: string, achievement: string) {
    const celebrations = [
      "🎉 Fantastic work!",
      "🚀 You're crushing it!",
      "⭐ Outstanding achievement!",
      "💪 Keep up the momentum!",
      "🏆 Goal achieved!",
    ]

    const randomCelebration = celebrations[Math.floor(Math.random() * celebrations.length)]

    this.addNotification({
      title: randomCelebration,
      message: `${achievement} You're making excellent progress on your ${goalType} goals!`,
      type: "success",
      action: {
        label: "View Progress",
        url: "/dashboard/analytics",
      },
    })
  }

  // Weekly summary with AI insights using server actions
  async generateWeeklySummary(weeklyStats: any) {
    try {
      const summary = await generateWeeklySummary(weeklyStats)

      this.addNotification({
        title: "📊 Weekly Productivity Summary",
        message: summary,
        type: "info",
        action: {
          label: "View Full Analytics",
          url: "/dashboard/analytics",
        },
      })
    } catch (error) {
      console.error("Failed to generate weekly summary:", error)

      // Fallback to simple summary
      this.addNotification({
        title: "📊 Weekly Summary",
        message: `This week you completed ${weeklyStats.tasksCompleted} tasks and wrote ${weeklyStats.totalWords} words. Great work!`,
        type: "info",
        action: {
          label: "View Analytics",
          url: "/dashboard/analytics",
        },
      })
    }
  }

  // Productivity reminders
  scheduleProductivityReminders() {
    // Morning motivation
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)

    const timeUntilTomorrow = tomorrow.getTime() - now.getTime()
    setTimeout(() => {
      this.addNotification({
        title: "🌅 Good Morning!",
        message: "Ready to make today productive? Set your goals and start creating!",
        type: "info",
        action: {
          label: "View Tasks",
          url: "/dashboard/tasks",
        },
      })

      // Schedule daily reminders
      setInterval(
        () => {
          this.addNotification({
            title: "🎯 Daily Check-in",
            message: "How's your progress today? Review your goals and celebrate your wins!",
            type: "info",
            action: {
              label: "View Progress",
              url: "/dashboard/analytics",
            },
          })
        },
        24 * 60 * 60 * 1000,
      ) // Daily
    }, timeUntilTomorrow)

    // Evening reflection
    const evening = new Date(now)
    evening.setHours(18, 0, 0, 0)
    if (evening < now) {
      evening.setDate(evening.getDate() + 1)
    }

    const timeUntilEvening = evening.getTime() - now.getTime()
    setTimeout(() => {
      this.addNotification({
        title: "🌅 Evening Reflection",
        message: "Take a moment to reflect on today's accomplishments and plan for tomorrow.",
        type: "info",
        action: {
          label: "View Analytics",
          url: "/dashboard/analytics",
        },
      })
    }, timeUntilEvening)
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    }
    return false
  }
}
