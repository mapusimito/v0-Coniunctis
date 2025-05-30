"use client"
import { useState, useEffect, useRef } from "react"

import { useTheme } from "next-themes"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabaseClient"
import { useIsMobile } from "@/hooks/use-mobile"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CardContent } from "@/components/ui/card"
import { CardDescription } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs } from "@/components/ui/tabs"
import { TabsList } from "@/components/ui/tabs"
import { TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { SelectContent } from "@/components/ui/select"
import { SelectItem } from "@/components/ui/select"
import { SelectTrigger } from "@/components/ui/select"
import { SelectValue } from "@/components/ui/select"
import { Dialog } from "@/components/ui/dialog"
import { DialogContent } from "@/components/ui/dialog"
import { DialogDescription } from "@/components/ui/dialog"
import { DialogHeader } from "@/components/ui/dialog"
import { DialogTitle } from "@/components/ui/dialog"
import { DialogTrigger } from "@/components/ui/dialog"
import { Avatar } from "@/components/ui/avatar"
import { AvatarFallback } from "@/components/ui/avatar"
import { AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu } from "@/components/ui/dropdown-menu"
import { DropdownMenuContent } from "@/components/ui/dropdown-menu"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  Target,
  CheckSquare,
  Coffee,
  Clock,
  Maximize,
  BarChart3,
  Plus,
  Check,
  Undo,
  LogOut,
} from "lucide-react"

interface PomodoroSettings {
  pomodoro_duration: number
  short_break_duration: number
  long_break_duration: number
  sound_enabled: boolean
  auto_start_breaks: boolean
  auto_start_pomodoros: boolean
}

type SessionType = "pomodoro" | "short_break" | "long_break"

interface Task {
  id: string
  title: string
  completed: boolean
  priority: string
  category: string
  estimated_pomodoros: number
  actual_pomodoros: number
  description?: string
}

export default function PomodoroPage() {
  const { theme } = useTheme()
  const isMobile = useIsMobile()
  const { user } = useAuth()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Timer state
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [currentSession, setCurrentSession] = useState<SessionType>("pomodoro")
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  // Define ciclo fijo Pomodoro
  const cycle: SessionType[] = [
    "pomodoro",
    "short_break",
    "pomodoro",
    "short_break",
    "pomodoro",
    "long_break",
  ]
  const [cyclePosition, setCyclePosition] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Settings state
  const [settings, setSettings] = useState<PomodoroSettings>({
    pomodoro_duration: 25,
    short_break_duration: 5,
    long_break_duration: 15,
    sound_enabled: true,
    auto_start_breaks: true,
    auto_start_pomodoros: false,
  })
  const [tempSettings, setTempSettings] = useState<PomodoroSettings>(settings)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "trabajo",
    estimated_pomodoros: 1,
  })

  // Stats state
  const [todayStats, setTodayStats] = useState({
    completed_pomodoros: 0,
    total_focus_time: 0,
    completed_tasks: 0,
  })

  // Saving state
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Load active task from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTask = localStorage.getItem("activePomodoro")
      if (savedTask) {
        try {
          const parsedTask = JSON.parse(savedTask)
          setActiveTask(parsedTask)
          localStorage.removeItem("activePomodoro")
        } catch (error) {
          console.error("Error parsing active task:", error)
        }
      }
    }
  }, [])

  // Initialize audio
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio()
      audioRef.current.preload = "auto"
    }
  }, [])

  // Load settings, tasks and stats on mount
  useEffect(() => {
    if (user) {
      loadSettings()
      fetchTasks()
      fetchCompletedTasks()
      loadTodayStats()
    }
  }, [user])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      handleSessionComplete()
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timeLeft])

  // Fullscreen effect
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const playNotificationSound = async () => {
    if (!settings.sound_enabled || !audioRef.current) return

    try {
      // Use a simple beep sound data URL
      const beepSound =
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT"
      audioRef.current.src = beepSound
      await audioRef.current.play()
    } catch (error) {
      console.log("Could not play notification sound:", error)
    }
  }

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.from("pomodoro_settings").select("*").eq("user_id", user?.id).single()

      if (error && error.code !== "PGRST116") {
        console.error("Error loading settings:", error)
        return
      }

      if (data) {
        const loadedSettings = {
          pomodoro_duration: data.pomodoro_duration,
          short_break_duration: data.short_break_duration,
          long_break_duration: data.long_break_duration,
          sound_enabled: data.sound_enabled ?? true,
          auto_start_breaks: data.auto_start_breaks ?? true,
          auto_start_pomodoros: data.auto_start_pomodoros ?? false,
        }
        setSettings(loadedSettings)
        setTempSettings(loadedSettings)

        if (currentSession === "pomodoro") {
          setTimeLeft(loadedSettings.pomodoro_duration * 60)
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const saveSettings = async () => {
    if (!user) {
      setSaveError("Debes iniciar sesión para guardar la configuración.")
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      // Primero verificar si ya existe configuración para este usuario
      const { data: existingSettings, error: checkError } = await supabase
        .from("pomodoro_settings")
        .select("id")
        .eq("user_id", user?.id)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError
      }

      let error
      if (existingSettings) {
        // Actualizar configuración existente
        const { error: updateError } = await supabase
          .from("pomodoro_settings")
          .update({
            pomodoro_duration: tempSettings.pomodoro_duration,
            short_break_duration: tempSettings.short_break_duration,
            long_break_duration: tempSettings.long_break_duration,
            sound_enabled: tempSettings.sound_enabled,
            auto_start_breaks: tempSettings.auto_start_breaks,
            auto_start_pomodoros: tempSettings.auto_start_pomodoros,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user?.id); 

        error = updateError
      } else {
        // Crear nueva configuración
        const { error: insertError } = await supabase.from("pomodoro_settings").insert({
          user_id: user?.id,
          pomodoro_duration: tempSettings.pomodoro_duration,
          short_break_duration: tempSettings.short_break_duration,
          long_break_duration: tempSettings.long_break_duration,
          sound_enabled: tempSettings.sound_enabled,
          auto_start_breaks: tempSettings.auto_start_breaks,
          auto_start_pomodoros: tempSettings.auto_start_pomodoros,
        })

        error = insertError
      }

      if (error) throw error

      setSettings(tempSettings)
      setSettingsOpen(false)
      const duration = getDurationForSession(currentSession, tempSettings)
      setTimeLeft(duration * 60)
    } catch (error) {
      setSaveError("Error al guardar la configuración.")
      console.error("Error saving settings:", error)
    } finally {
      setSaving(false)
    }
  }

  const loadTodayStats = async () => {
    try {
      const today = new Date().toISOString().split("T")[0]

      // Get today's completed pomodoro sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from("pomodoro_sessions")
        .select("duration")
        .eq("user_id", user?.id)
        .eq("completed", true)
        .gte("completed_at", `${today}T00:00:00`)
        .lt("completed_at", `${today}T23:59:59`)

      if (sessionsError) throw sessionsError

      // Get today's completed tasks
      const { data: completedTasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id")
        .eq("user_id", user?.id)
        .eq("completed", true)
        .gte("updated_at", `${today}T00:00:00`)

      if (tasksError) throw tasksError

      const totalFocusTime = sessions?.reduce((sum, session) => sum + session.duration, 0) || 0

      setTodayStats({
        completed_pomodoros: sessions?.length || 0,
        total_focus_time: totalFocusTime,
        completed_tasks: completedTasks?.length || 0,
      })
    } catch (error) {
      console.error("Error loading today stats:", error)
    }
  }

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user?.id)
        .eq("completed", false)
        .order("created_at", { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error("Error fetching tasks:", error)
    }
  }

  const fetchCompletedTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user?.id)
        .eq("completed", true)
        .order("updated_at", { ascending: false })
        .limit(10)

      if (error) throw error
      setCompletedTasks(data || [])
    } catch (error) {
      console.error("Error fetching completed tasks:", error)
    }
  }

  const toggleTaskCompletion = async (task: Task) => {
    try {
      const newCompletedStatus = !task.completed
      const { error } = await supabase
        .from("tasks")
        .update({
          completed: newCompletedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id)

      if (error) throw error

      // Refresh both lists
      await fetchTasks()
      await fetchCompletedTasks()
      await loadTodayStats()

      // If the active task was completed, remove it from active
      if (activeTask?.id === task.id && newCompletedStatus) {
        setActiveTask(null)
      }
    } catch (error) {
      console.error("Error toggling task completion:", error)
    }
  }

  const addNewTask = async () => {
    if (!newTask.title.trim()) return

    try {
      const { error } = await supabase.from("tasks").insert({
        user_id: user?.id,
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        category: newTask.category,
        estimated_pomodoros: newTask.estimated_pomodoros,
        actual_pomodoros: 0,
        completed: false,
      })

      if (error) throw error

      // Reset form
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        category: "trabajo",
        estimated_pomodoros: 1,
      })
      setShowAddTask(false)

      // Refresh tasks
      await fetchTasks()
    } catch (error) {
      console.error("Error adding task:", error)
    }
  }

  const getDurationForSession = (session: SessionType, settingsToUse = settings) => {
    switch (session) {
      case "pomodoro":
        return settingsToUse.pomodoro_duration
      case "short_break":
        return settingsToUse.short_break_duration
      case "long_break":
        return settingsToUse.long_break_duration
      default:
        return settingsToUse.pomodoro_duration
    }
  }

<<<<<<< Updated upstream
=======
  const getNextSessionInCycle = (currentPos: number): SessionType => {
    const cycle: SessionType[] = [
      "pomodoro",
      "short_break",
      "pomodoro",
      "short_break",
      "pomodoro",
      "short_break",
      "pomodoro",
      "long_break",
    ]
    // Protección contra índices fuera de rango
    if (currentPos < 0 || currentPos >= cycle.length) {
      return "pomodoro"
    }
    return cycle[currentPos]
  }

>>>>>>> Stashed changes
  const handleSessionComplete = async () => {
    setIsRunning(false)
    await playNotificationSound()

    // Show browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      const sessionName =
        currentSession === "pomodoro"
          ? "Pomodoro"
          : currentSession === "short_break"
          ? "Descanso Corto"
          : "Descanso Largo"
      new Notification(`¡${sessionName} Completado!`, {
        body: currentSession === "pomodoro" ? "¡Tiempo de descanso!" : "¡Hora de trabajar!",
        icon: "/favicon.ico",
      })
    }

    // Update stats and tasks
    if (currentSession === "pomodoro") {
      setCompletedPomodoros((prev) => prev + 1)
      if (activeTask) {
        await updateTaskPomodoros()
      }
      await recordSession()
      await loadTodayStats()
    }

    // Avanzar en el ciclo fijo
    const nextPosition = (cyclePosition + 1) % cycle.length
    const nextSession = cycle[nextPosition]

    setCyclePosition(nextPosition)
    setCurrentSession(nextSession)
    setTimeLeft(getDurationForSession(nextSession) * 60)

    // Auto-start based on settings
    const shouldAutoStart =
      (nextSession === "pomodoro" && settings.auto_start_pomodoros) ||
      (nextSession !== "pomodoro" && settings.auto_start_breaks)

    if (shouldAutoStart) {
      setTimeout(() => {
        setIsRunning(true)
      }, 1000)
    }
  }

  const updateTaskPomodoros = async () => {
    if (!activeTask) return

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          actual_pomodoros: activeTask.actual_pomodoros + 1,
        })
        .eq("id", activeTask.id)

      if (error) throw error

      setActiveTask((prev) => (prev ? { ...prev, actual_pomodoros: prev.actual_pomodoros + 1 } : null))
      setTasks((prev) =>
        prev.map((task) =>
          task.id === activeTask.id ? { ...task, actual_pomodoros: task.actual_pomodoros + 1 } : task,
        ),
      )
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const recordSession = async () => {
    try {
      await supabase.from("pomodoro_sessions").insert({
        user_id: user?.id,
        task_id: activeTask?.id || null,
        duration: settings.pomodoro_duration,
        session_type: "work",
        completed: true,
        completed_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error recording session:", error)
    }
  }

  const handleTabChange = (newSession: SessionType) => {
    if (isRunning) {
      setIsRunning(false)
    }

    setCurrentSession(newSession)
    setTimeLeft(getDurationForSession(newSession) * 60)

    // Reinicia el ciclo según la pestaña seleccionada
    if (newSession === "pomodoro") {
      setCyclePosition(0)
    } else if (newSession === "short_break") {
      setCyclePosition(1)
    } else if (newSession === "long_break") {
      setCyclePosition(5)
    }
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(getDurationForSession(currentSession) * 60)
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error)
    }
  }

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getProgressPercentage = () => {
    const totalDuration = getDurationForSession(currentSession) * 60
    return ((totalDuration - timeLeft) / totalDuration) * 100
  }

  const getSessionColor = (session: SessionType) => {
    switch (session) {
      case "pomodoro":
        return "text-red-600"
      case "short_break":
        return "text-green-600"
      case "long_break":
        return "text-blue-600"
      default:
        return "text-red-600"
    }
  }

  // Función mejorada para el fondo del temporizador en modo oscuro
  const getSessionBg = (session: SessionType) => {
    if (typeof window !== "undefined" && document.documentElement.classList.contains("dark")) {
      switch (session) {
        case "pomodoro":
          return "bg-zinc-900 border-2 border-red-500"
        case "short_break":
          return "bg-zinc-900 border-2 border-green-500"
        case "long_break":
          return "bg-zinc-900 border-2 border-blue-500"
        default:
          return "bg-zinc-900 border-2 border-red-500"
      }
    }
    // Modo claro
    switch (session) {
      case "pomodoro":
        return "bg-red-50 border-2 border-red-200"
      case "short_break":
        return "bg-green-50 border-2 border-green-200"
      case "long_break":
        return "bg-blue-50 border-2 border-blue-200"
      default:
        return "bg-red-50 border-2 border-red-200"
    }
  }

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission()
  }, [])

  if (isFullscreen) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${getSessionBg(currentSession)}`}>
        <div className="text-center space-y-8 p-8">
          <div className={`text-9xl font-bold ${getSessionColor(currentSession)}`}>{formatTime(timeLeft)}</div>
          <div className="space-y-4">
            <h2 className={`text-4xl font-semibold ${getSessionColor(currentSession)}`}>
              {currentSession === "pomodoro"
                ? "Pomodoro"
                : currentSession === "short_break"
                  ? "Descanso Corto"
                  : "Descanso Largo"}
            </h2>
            {activeTask && <p className="text-2xl text-gray-600">{activeTask.title}</p>}
          </div>
          <div className="flex justify-center space-x-6">
            <Button size="lg" onClick={() => setIsRunning(!isRunning)} className="px-8 py-4 text-xl">
              {isRunning ? <Pause className="w-8 h-8 mr-3" /> : <Play className="w-8 h-8 mr-3" />}
              {isRunning ? "Pausar" : "Iniciar"}
            </Button>
            <Button size="lg" variant="outline" onClick={resetTimer} className="px-6 py-4">
              <RotateCcw className="w-8 h-8" />
            </Button>
            <Button size="lg" variant="outline" onClick={toggleFullscreen} className="px-6 py-4">
              <Maximize className="w-8 h-8" />
            </Button>
          </div>
          <Progress value={getProgressPercentage()} className="w-96 h-6 mx-auto" />
        </div>
      </div>
    )
  }

  // VISTA MÓVIL
  if (isMobile) {
    return (
      <div
        className={`min-h-screen flex flex-col justify-between pb-24 px-2 pt-2 max-w-md mx-auto ${
          theme === "dark" ? "bg-gray-950 text-white" : "bg-white text-foreground"
        }`}
      >
        {/* Header con perfil y configuración */}
        <div className="flex items-center justify-between mb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarImage src={user?.avatar_url || "/placeholder.svg"} alt={user?.full_name || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 modern-card" align="start" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.full_name || "Usuario"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await supabase.auth.signOut()
                }}
                className="cursor-pointer text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Botón de configuración */}
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Settings className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm mx-2">
                <DialogHeader>
                <DialogTitle>Configuración</DialogTitle>
                <DialogDescription>Personaliza tu experiencia de pomodoro</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Duraciones (minutos)</h4>
                  <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Pomodoro</Label>
                    <Input
                    type="number"
                    value={tempSettings.pomodoro_duration}
                    onChange={(e) =>
                      setTempSettings((prev) => ({
                      ...prev,
                      pomodoro_duration: Number.parseInt(e.target.value) || 25,
                      }))
                    }
                    min="1"
                    max="60"
                    className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Descanso Corto</Label>
                    <Input
                    type="number"
                    value={tempSettings.short_break_duration}
                    onChange={(e) =>
                      setTempSettings((prev) => ({
                      ...prev,
                      short_break_duration: Number.parseInt(e.target.value) || 5,
                      }))
                    }
                    min="1"
                    max="30"
                    className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Descanso Largo</Label>
                    <Input
                    type="number"
                    value={tempSettings.long_break_duration}
                    onChange={(e) =>
                      setTempSettings((prev) => ({
                      ...prev,
                      long_break_duration: Number.parseInt(e.target.value) || 15,
                      }))
                    }
                    min="1"
                    max="60"
                    className="h-8 text-xs"
                    />
                  </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Automatización</h4>
                  <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Sonidos</Label>
                    <Switch
                    checked={tempSettings.sound_enabled}
                    onCheckedChange={(checked) =>
                      setTempSettings((prev) => ({
                      ...prev,
                      sound_enabled: checked,
                      }))
                    }
                    />
                  </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Auto-iniciar descansos</Label>
                      <Switch
                        checked={tempSettings.auto_start_breaks}
                        onCheckedChange={(checked) =>
                          setTempSettings((prev) => ({
                            ...prev,
                            auto_start_breaks: checked,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Auto-iniciar pomodoros</Label>
                      <Switch
                        checked={tempSettings.auto_start_pomodoros}
                        onCheckedChange={(checked) =>
                          setTempSettings((prev) => ({
                            ...prev,
                            auto_start_pomodoros: checked,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button onClick={saveSettings} className="flex-1 h-8 text-xs" disabled={saving}>
                    {saving ? "Guardando..." : "Guardar"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSettingsOpen(false)}
                    className="flex-1 h-8 text-xs"
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                </div>
                {saveError && <p className="text-red-500 text-xs">{saveError}</p>}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Título y subtítulo */}
        <div className="text-center mb-2">
          <h1 className="text-lg font-bold leading-tight">Temporizador Pomodoro</h1>
          <p className="text-xs text-muted-foreground">Enfócate en tus tareas con la Técnica Pomodoro</p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <Card className="p-0 bg-background dark:bg-zinc-900">
            <CardContent className="p-2 flex flex-col items-center">
              <span className="text-[11px] font-medium text-muted-foreground">Pomodoros hoy</span>
              <span className="text-lg font-bold text-red-600">{todayStats.completed_pomodoros}</span>
            </CardContent>
          </Card>
          <Card className="p-0 bg-background dark:bg-zinc-900">
            <CardContent className="p-2 flex flex-col items-center">
              <span className="text-[11px] font-medium text-muted-foreground">Tiempo de enfoque</span>
              <span className="text-lg font-bold text-blue-600">
                {Math.floor(todayStats.total_focus_time / 60)}h {todayStats.total_focus_time % 60}m
              </span>
            </CardContent>
          </Card>
          <Card className="p-0 bg-background dark:bg-zinc-900">
            <CardContent className="p-2 flex flex-col items-center">
              <span className="text-[11px] font-medium text-muted-foreground">Tareas completadas</span>
              <span className="text-lg font-bold text-green-600">{todayStats.completed_tasks}</span>
            </CardContent>
          </Card>
        </div>

        {/* Temporizador principal */}
        <Card className={`mb-2 ${getSessionBg(currentSession)}`}>
          <CardContent className="flex flex-col items-center justify-center p-4">
            <div className={`text-5xl font-bold ${getSessionColor(currentSession)} mb-2`}>{formatTime(timeLeft)}</div>
            <div className="flex justify-center space-x-2 mb-2">
              <Button size="sm" onClick={() => setIsRunning(!isRunning)} className="px-4 py-1 text-xs">
                {isRunning ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                {isRunning ? "Pausar" : "Iniciar"}
              </Button>
              <Button size="sm" variant="outline" onClick={resetTimer} className="px-2 py-1">
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={toggleFullscreen} className="px-2 py-1">
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
            <Progress value={getProgressPercentage()} className="h-2 w-full mb-1" />
            <div className="text-[11px] text-muted-foreground">{Math.round(getProgressPercentage())}% completado</div>
          </CardContent>
        </Card>

        {/* Tabs para cambiar sesión */}
        <Tabs value={currentSession} onValueChange={(value) => handleTabChange(value as SessionType)}>
          <TabsList className="grid w-full grid-cols-3 mb-2">
            <TabsTrigger value="pomodoro" className="text-red-600 text-xs">
              Pomo
            </TabsTrigger>
            <TabsTrigger value="short_break" className="text-green-600 text-xs">
              Des. C
            </TabsTrigger>
            <TabsTrigger value="long_break" className="text-blue-600 text-xs">
              Des. L
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tareas activas y disponibles */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Card className="p-0 bg-background dark:bg-zinc-900">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-semibold flex items-center gap-1">
                <Target className="w-4 h-4 text-primary" />
                Tarea Activa
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              {activeTask ? (
                <div className="space-y-1">
                  <div className="font-semibold text-xs truncate">{activeTask.title}</div>
                  <div className="flex items-center space-x-1 mt-1">
                    <Badge
                      variant={
                        activeTask.priority === "high"
                          ? "destructive"
                          : activeTask.priority === "medium"
                            ? "default"
                            : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {activeTask.priority === "high" ? "Alta" : activeTask.priority === "medium" ? "Media" : "Baja"}
                    </Badge>
                  </div>
                  <div className="text-[11px] font-medium mt-1">
                    🍅 {activeTask.actual_pomodoros}/{activeTask.estimated_pomodoros}
                  </div>
                  <Progress
                    value={(activeTask.actual_pomodoros / activeTask.estimated_pomodoros) * 100}
                    className="h-1 mt-1"
                  />
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setActiveTask(null)}
                    className="w-full mt-2 text-xs py-1"
                  >
                    Quitar
                  </Button>
                </div>
              ) : (
                <div className="text-center py-2 text-muted-foreground text-xs">
                  <Target className="w-6 h-6 mx-auto mb-1 text-muted-foreground/40" />
                  <p>No hay tarea activa</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="p-0 bg-background dark:bg-zinc-900">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-semibold flex items-center gap-1 justify-between">
                <div className="flex items-center gap-1">
                  <CheckSquare className="w-4 h-4 text-secondary" />
                  Tareas
                </div>
                <Button variant="ghost" size="xs" onClick={() => setShowAddTask(true)} className="p-1 h-5 w-5">
                  <Plus className="w-3 h-3" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3 max-h-32 overflow-y-auto">
              {tasks.length > 0 ? (
                tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center space-x-2 p-1 border rounded-lg hover:bg-muted/50 mb-1"
                  >
                    <button
                      onClick={() => toggleTaskCompletion(task)}
                      className="flex-shrink-0 w-4 h-4 border rounded flex items-center justify-center hover:bg-green-100"
                    >
                      {task.completed && <Check className="w-3 h-3 text-green-600" />}
                    </button>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setActiveTask(task)}>
                      <p className="font-medium truncate text-xs">{task.title}</p>
                      <div className="text-[10px] text-muted-foreground">
                        🍅 {task.actual_pomodoros}/{task.estimated_pomodoros}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-2 text-muted-foreground text-xs">
                  <p>No hay tareas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tareas completadas */}
        {completedTasks.length > 0 && (
          <Card className="p-0 bg-background dark:bg-zinc-900 mb-2">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-semibold flex items-center gap-1">
                <Check className="w-4 h-4 text-green-600" />
                Completadas
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3 max-h-24 overflow-y-auto">
              {completedTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center space-x-2 p-1 border rounded-lg mb-1 opacity-60">
                  <button
                    onClick={() => toggleTaskCompletion(task)}
                    className="flex-shrink-0 w-4 h-4 border rounded flex items-center justify-center bg-green-100"
                  >
                    <Check className="w-3 h-3 text-green-600" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-xs line-through">{task.title}</p>
                  </div>
                  <button onClick={() => toggleTaskCompletion(task)} className="flex-shrink-0 p-1">
                    <Undo className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Dialog para agregar nueva tarea */}
        <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
          <DialogContent className="max-w-sm mx-2">
            <DialogHeader>
              <DialogTitle>Nueva Tarea</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Título</Label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Nombre de la tarea"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Descripción</Label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción opcional"
                  className="h-16 text-xs resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Prioridad</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask((prev) => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Pomodoros</Label>
                  <Input
                    type="number"
                    value={newTask.estimated_pomodoros}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, estimated_pomodoros: Number.parseInt(e.target.value) || 1 }))
                    }
                    min="1"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={addNewTask} className="flex-1 h-8 text-xs">
                  Agregar
                </Button>
                <Button variant="outline" onClick={() => setShowAddTask(false)} className="flex-1 h-8 text-xs">
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // VISTA ESCRITORIO
  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Temporizador Pomodoro</h1>
        <p className="text-gray-600">Enfócate en tus tareas con la Técnica Pomodoro</p>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pomodoros Hoy</p>
                  <p className="text-2xl font-bold text-red-600">{todayStats.completed_pomodoros}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tiempo de Enfoque</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.floor(todayStats.total_focus_time / 60)}h {todayStats.total_focus_time % 60}m
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckSquare className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tareas Completadas</p>
                  <p className="text-2xl font-bold text-green-600">{todayStats.completed_tasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Timer Card - Aplicando el estilo mejorado para modo oscuro */}
        <Card className={`text-center mb-6 ${getSessionBg(currentSession)}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                <Maximize className="w-4 h-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    currentSession === "pomodoro"
                      ? "bg-red-500"
                      : currentSession === "short_break"
                        ? "bg-green-500"
                        : "bg-blue-500"
                  }`}
                />
                <CardTitle className={`text-2xl ${getSessionColor(currentSession)}`}>
                  {currentSession === "pomodoro"
                    ? "Pomodoro"
                    : currentSession === "short_break"
                      ? "Descanso Corto"
                      : "Descanso Largo"}
                </CardTitle>
              </div>
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                  <DialogTitle>Configuración del Pomodoro</DialogTitle>
                  <DialogDescription>Personaliza tu experiencia de pomodoro</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Duraciones (minutos)</h4>
                    <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Pomodoro</Label>
                      <Input
                      type="number"
                      value={tempSettings.pomodoro_duration}
                      onChange={(e) =>
                        setTempSettings((prev) => ({
                        ...prev,
                        pomodoro_duration: Number.parseInt(e.target.value) || 25,
                        }))
                      }
                      min="1"
                      max="60"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descanso Corto</Label>
                      <Input
                      type="number"
                      value={tempSettings.short_break_duration}
                      onChange={(e) =>
                        setTempSettings((prev) => ({
                        ...prev,
                        short_break_duration: Number.parseInt(e.target.value) || 5,
                        }))
                      }
                      min="1"
                      max="30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descanso Largo</Label>
                      <Input
                      type="number"
                      value={tempSettings.long_break_duration}
                      onChange={(e) =>
                        setTempSettings((prev) => ({
                        ...prev,
                        long_break_duration: Number.parseInt(e.target.value) || 15,
                        }))
                      }
                      min="1"
                      max="60"
                      />
                    </div>
                    </div>
                  </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Automatización</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Sonidos de notificación</Label>
                          <Switch
                            checked={tempSettings.sound_enabled}
                            onCheckedChange={(checked) =>
                              setTempSettings((prev) => ({
                                ...prev,
                                sound_enabled: checked,
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Auto-iniciar descansos</Label>
                          <Switch
                            checked={tempSettings.auto_start_breaks}
                            onCheckedChange={(checked) =>
                              setTempSettings((prev) => ({
                                ...prev,
                                auto_start_breaks: checked,
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Auto-iniciar pomodoros</Label>
                          <Switch
                            checked={tempSettings.auto_start_pomodoros}
                            onCheckedChange={(checked) =>
                              setTempSettings((prev) => ({
                                ...prev,
                                auto_start_pomodoros: checked,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button onClick={saveSettings} className="flex-1" disabled={saving}>
                        {saving ? "Guardando..." : "Guardar"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSettingsOpen(false)}
                        className="flex-1"
                        disabled={saving}
                      >
                        Cancelar
                      </Button>
                    </div>
                    {saveError && <p className="text-red-500 text-xs mt-2">{saveError}</p>}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {activeTask && (
              <CardDescription className="text-lg">
                Trabajando en: <span className="font-semibold">{activeTask.title}</span>
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-8">
            <div className={`text-8xl font-bold ${getSessionColor(currentSession)} mb-6`}>{formatTime(timeLeft)}</div>

            <div className="space-y-2">
              <Progress value={getProgressPercentage()} className="h-4" />
              <div className="text-sm text-gray-600">{Math.round(getProgressPercentage())}% completado</div>
            </div>

            <div className="flex justify-center space-x-4">
              <Button size="lg" onClick={() => setIsRunning(!isRunning)} className="px-8 py-4 text-lg">
                {isRunning ? (
                  <>
                    <Pause className="w-6 h-6 mr-2" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6 mr-2" />
                    Iniciar
                  </>
                )}
              </Button>
              <Button size="lg" variant="outline" onClick={resetTimer} className="px-6 py-4">
                <RotateCcw className="w-6 h-6" />
              </Button>
              <Button size="lg" variant="outline" onClick={toggleFullscreen} className="px-6 py-4">
                <Maximize className="w-6 h-6" />
              </Button>
            </div>

            <Tabs value={currentSession} onValueChange={(value) => handleTabChange(value as SessionType)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pomodoro" className="text-red-600">
                  <Clock className="w-4 h-4 mr-2" />
                  Pomodoro
                </TabsTrigger>
                <TabsTrigger value="short_break" className="text-green-600">
                  <Coffee className="w-4 h-4 mr-2" />
                  Descanso Corto
                </TabsTrigger>
                <TabsTrigger value="long_break" className="text-blue-600">
                  <Coffee className="w-4 h-4 mr-2" />
                  Descanso Largo
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Tasks Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-primary" />
                <span>Tarea Activa</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeTask ? (
                <div className="space-y-3">
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <h3 className="font-semibold">{activeTask.title}</h3>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge
                        variant={
                          activeTask.priority === "high"
                            ? "destructive"
                            : activeTask.priority === "medium"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {activeTask.priority === "high" ? "Alta" : activeTask.priority === "medium" ? "Media" : "Baja"}
                      </Badge>
                      <span className="text-sm text-gray-600">{activeTask.category}</span>
                    </div>
                    <div className="mt-2">
                      <div className="text-sm font-medium">
                        🍅 {activeTask.actual_pomodoros}/{activeTask.estimated_pomodoros}
                      </div>
                      <Progress
                        value={(activeTask.actual_pomodoros / activeTask.estimated_pomodoros) * 100}
                        className="h-2 mt-1"
                      />
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setActiveTask(null)} className="w-full">
                    Quitar Tarea Activa
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay tarea activa</p>
                  <p className="text-sm">Puedes usar el pomodoro sin una tarea específica</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckSquare className="w-5 h-5 text-secondary" />
                  <span>Tareas Disponibles</span>
                </div>
                <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Nueva Tarea</DialogTitle>
                      <DialogDescription>Agrega una nueva tarea a tu lista</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Título</Label>
                        <Input
                          value={newTask.title}
                          onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                          placeholder="Nombre de la tarea"
                        />
                      </div>
                      <div>
                        <Label>Descripción</Label>
                        <Textarea
                          value={newTask.description}
                          onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                          placeholder="Descripción opcional"
                          className="resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Prioridad</Label>
                          <Select
                            value={newTask.priority}
                            onValueChange={(value) => setNewTask((prev) => ({ ...prev, priority: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Baja</SelectItem>
                              <SelectItem value="medium">Media</SelectItem>
                              <SelectItem value="high">Alta</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Pomodoros Estimados</Label>
                          <Input
                            type="number"
                            value={newTask.estimated_pomodoros}
                            onChange={(e) =>
                              setNewTask((prev) => ({
                                ...prev,
                                estimated_pomodoros: Number.parseInt(e.target.value) || 1,
                              }))
                            }
                            min="1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Categoría</Label>
                        <Select
                          value={newTask.category}
                          onValueChange={(value) => setNewTask((prev) => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="trabajo">Trabajo</SelectItem>
                            <SelectItem value="personal">Personal</SelectItem>
                            <SelectItem value="estudio">Estudio</SelectItem>
                            <SelectItem value="proyecto">Proyecto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={addNewTask} className="flex-1">
                          Agregar Tarea
                        </Button>
                        <Button variant="outline" onClick={() => setShowAddTask(false)} className="flex-1">
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-64 overflow-y-auto">
              {tasks.length > 0 ? (
                tasks.slice(0, 8).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center space-x-3 p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <button
                      onClick={() => toggleTaskCompletion(task)}
                      className="flex-shrink-0 w-5 h-5 border rounded flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-900"
                    >
                      {task.completed && <Check className="w-3 h-3 text-green-600" />}
                    </button>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setActiveTask(task)}>
                      <p className="font-medium truncate text-sm">{task.title}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge
                          variant={
                            task.priority === "high"
                              ? "destructive"
                              : task.priority === "medium"
                                ? "default"
                                : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Media" : "Baja"}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          🍅 {task.actual_pomodoros}/{task.estimated_pomodoros}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No hay tareas disponibles</p>
                  <Button variant="outline" size="sm" onClick={() => setShowAddTask(true)} className="mt-2">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primera Tarea
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-600" />
                <span>Tareas Completadas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-64 overflow-y-auto">
              {completedTasks.length > 0 ? (
                completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center space-x-3 p-2 border rounded-lg opacity-60 hover:opacity-80"
                  >
                    <button
                      onClick={() => toggleTaskCompletion(task)}
                      className="flex-shrink-0 w-5 h-5 border rounded flex items-center justify-center bg-green-100 dark:bg-green-900"
                    >
                      <Check className="w-3 h-3 text-green-600" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm line-through">{task.title}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Media" : "Baja"}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          🍅 {task.actual_pomodoros}/{task.estimated_pomodoros}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleTaskCompletion(task)}
                      className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Reactivar tarea"
                    >
                      <Undo className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No hay tareas completadas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
