"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  Target,
  CheckSquare,
  Coffee,
  Clock,
  Volume2,
  VolumeX,
  Maximize,
  BarChart3,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabaseClient"
import { useTheme } from "next-themes"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

interface Task {
  id: string
  title: string
  completed: boolean
  priority: string
  category: string
  estimated_pomodoros: number
  actual_pomodoros: number
}

interface PomodoroSettings {
  pomodoro_duration: number
  short_break_duration: number
  long_break_duration: number
  pomodoros_until_long_break: number
  sound_enabled: boolean
  auto_start_breaks: boolean
  auto_start_pomodoros: boolean
}

type SessionType = "pomodoro" | "short_break" | "long_break"

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
  const [cyclePosition, setCyclePosition] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Settings state
  const [settings, setSettings] = useState<PomodoroSettings>({
    pomodoro_duration: 25,
    short_break_duration: 5,
    long_break_duration: 15,
    pomodoros_until_long_break: 4,
    sound_enabled: true,
    auto_start_breaks: true,
    auto_start_pomodoros: false,
  })
  const [tempSettings, setTempSettings] = useState<PomodoroSettings>(settings)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)

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
          pomodoros_until_long_break: data.pomodoros_until_long_break,
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
            pomodoros_until_long_break: tempSettings.pomodoros_until_long_break,
            sound_enabled: tempSettings.sound_enabled,
            auto_start_breaks: tempSettings.auto_start_breaks,
            auto_start_pomodoros: tempSettings.auto_start_pomodoros,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user?.id)

        error = updateError
      } else {
        // Crear nueva configuración
        const { error: insertError } = await supabase.from("pomodoro_settings").insert({
          user_id: user?.id,
          pomodoro_duration: tempSettings.pomodoro_duration,
          short_break_duration: tempSettings.short_break_duration,
          long_break_duration: tempSettings.long_break_duration,
          pomodoros_until_long_break: tempSettings.pomodoros_until_long_break,
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

  const getNextSessionInCycle = (currentPos: number): SessionType => {
    const cycle = [
      "pomodoro",
      "short_break",
      "pomodoro",
      "short_break",
      "pomodoro",
      "short_break",
      "pomodoro",
      "long_break",
    ]
    return cycle[currentPos] as SessionType
  }

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

    // Auto-advance to next session
    const nextPosition = (cyclePosition + 1) % 8
    const nextSession = getNextSessionInCycle(nextPosition)

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

    if (newSession === "pomodoro") {
      setCyclePosition(0)
    } else if (newSession === "short_break") {
      setCyclePosition(1)
    } else if (newSession === "long_break") {
      setCyclePosition(7)
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

  // Ajusta la función getSessionBg para modo oscuro en escritorio
  const getSessionBg = (session: SessionType) => {
    // En modo oscuro, fondo gris y borde de color según la pestaña
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
    // Modo claro (igual que antes)
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
        {/* Perfil en la esquina superior izquierda */}
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
        </div>

        {/* Título y subtítulo */}
        <div className="text-center mb-2">
          <h1 className="text-lg font-bold leading-tight">Temporizador Pomodoro</h1>
          <p className="text-xs text-muted-foreground">
            Enfócate en tus tareas con la Técnica Pomodoro
          </p>
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
        <Card className={`mb-2 bg-background dark:bg-zinc-900 border-2 ${getSessionBg(currentSession)}`}>
          <CardContent className="flex flex-col items-center justify-center p-4">
            <div className={`text-5xl font-bold ${getSessionColor(currentSession)} mb-2`}>
              {formatTime(timeLeft)}
            </div>
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
        <div className="grid grid-cols-2 gap-2">
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
                      {activeTask.priority === "high"
                        ? "Alta"
                        : activeTask.priority === "medium"
                        ? "Media"
                        : "Baja"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{activeTask.category}</span>
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
              <CardTitle className="text-xs font-semibold flex items-center gap-1">
                <CheckSquare className="w-4 h-4 text-secondary" />
                Tareas Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3 max-h-32 overflow-y-auto">
              {tasks.length > 0 ? (
                tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center space-x-2 p-1 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => setActiveTask(task)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-xs">{task.title}</p>
                      <div className="flex items-center space-x-1 mt-0.5">
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
                          {task.priority === "high"
                            ? "Alta"
                            : task.priority === "medium"
                            ? "Media"
                            : "Baja"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      🍅 {task.actual_pomodoros}/{task.estimated_pomodoros}
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
      </div>
    </div>
  )
}
