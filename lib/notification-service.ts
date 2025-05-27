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
  private subscribers: ((notifications: Notification[]) => void)[] = []

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.subscribers.push(callback)
    callback(this.notifications)

    return () => {
      const index = this.subscribers.indexOf(callback)
      if (index > -1) {
        this.subscribers.splice(index, 1)
      }
    }
  }

  private notifySubscribers() {
    this.subscribers.forEach((callback) => callback(this.notifications))
  }

  addNotification(notification: Omit<Notification, "id" | "timestamp" | "read">) {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    }

    this.notifications.unshift(newNotification)
    this.notifySubscribers()

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
      this.notifySubscribers()
    }
  }

  markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true))
    this.notifySubscribers()
  }

  deleteNotification(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id)
    this.notifySubscribers()
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length
  }

  async requestPermission(): Promise<NotificationPermission> {
    if ("Notification" in window) {
      return await Notification.requestPermission()
    }
    return "denied"
  }

  scheduleProductivityReminders() {
    // Schedule a reminder every 2 hours during work hours
    const scheduleReminder = () => {
      const now = new Date()
      const hour = now.getHours()

      // Only during work hours (9 AM to 6 PM)
      if (hour >= 9 && hour <= 18) {
        this.addNotification({
          title: "Productivity Reminder",
          message: "Don't forget to focus on your most important tasks today!",
          type: "info",
          action: {
            label: "View Dashboard",
            url: "/dashboard",
          },
        })
      }
    }

    // Schedule initial reminder and then every 2 hours
    setTimeout(scheduleReminder, 5000) // First reminder after 5 seconds
    setInterval(scheduleReminder, 2 * 60 * 60 * 1000) // Every 2 hours
  }

  async generateProductivityInsight(userId: string): Promise<any> {
    const insight = {
      title: "Productivity Insight",
      message: "Here's a productivity insight to help you stay on track!",
      type: "info" as const,
      action: {
        label: "View Dashboard",
        url: "/dashboard",
      },
    }

    this.addNotification(insight)
    return insight
  }

  async celebrateGoalAchievement(userId: string, goalName: string): Promise<any> {
    const celebration = {
      title: "Goal Achieved! 🎉",
      message: `Congratulations! You've achieved your goal: ${goalName}!`,
      type: "success" as const,
      action: {
        label: "View Dashboard",
        url: "/dashboard",
      },
    }

    this.addNotification(celebration)
    return celebration
  }

  async generateWeeklySummary(userId: string): Promise<any> {
    const summary = {
      title: "Weekly Summary",
      message: "Here's your weekly productivity summary.",
      type: "info" as const,
      action: {
        label: "View Analytics",
        url: "/dashboard/analytics",
      },
    }

    this.addNotification(summary)
    return summary
  }

  async sendCustomNotification(userId: string, message: string, actionLabel: string, actionUrl: string): Promise<any> {
    const notification = {
      title: "Custom Notification",
      message: message,
      type: "info" as const,
      action: {
        label: actionLabel,
        url: actionUrl,
      },
    }

    this.addNotification(notification)
    return notification
  }
}

// Export default instance for backward compatibility
export default NotificationService.getInstance()
