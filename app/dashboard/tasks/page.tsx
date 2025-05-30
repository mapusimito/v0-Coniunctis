"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Clock, CheckSquare, Circle, Play, MoreHorizontal, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

// Hook para detectar móvil
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener("resize", check)
    check()
    return () => window.removeEventListener("resize", check)
  }, [])
  return isMobile
}

interface Task {
  id: string
  title: string
  description: string
  completed: boolean
  priority: string
  category: string
  estimated_pomodoros: number
  actual_pomodoros: number
  created_at: string
}

export default function TasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "general",
    estimated_pomodoros: 1,
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const router = useRouter()
  const isMobile = useIsMobile()

  useEffect(() => {
    if (user) {
      fetchTasks()
    }
  }, [user])

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateTask = async (taskId: string, updatedData: Partial<Task>) => {
    try {
      const { error } = await supabase.from("tasks").update(updatedData).eq("id", taskId)

      if (error) throw error

      setTasks(tasks.map((task) => (task.id === taskId ? { ...task, ...updatedData } : task)))
      setIsEditDialogOpen(false)
      setEditTask(null)
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const toggleTask = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase.from("tasks").update({ completed: !completed }).eq("id", id)

      if (error) throw error

      setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !completed } : task)))
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const addTask = async () => {
    if (!newTask.title.trim()) return

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          ...newTask,
          user_id: user?.id,
        })
        .select()
        .single()

      if (error) throw error

      setTasks([data, ...tasks])
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        category: "general",
        estimated_pomodoros: 1,
      })
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error creating task:", error)
    }
  }

  const deleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return

    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id)

      if (error) throw error

      setTasks(tasks.filter((task) => task.id !== id))
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  const startPomodoro = async (task: Task) => {
    try {
      // Guarda la tarea activa en localStorage para que pomodoro pueda accederla
      localStorage.setItem("activePomodoro", JSON.stringify(task))
      router.push("/dashboard/pomodoro")
    } catch (error) {
      console.error("Error starting pomodoro:", error)
    }
  }

  const completedTasks = tasks.filter((task) => task.completed)
  const activeTasks = tasks.filter((task) => !task.completed)
  const totalTasks = tasks.length
  const progressPercentage = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0

  // Ordenar tareas por prioridad: high > medium > low
  const priorityOrder = { high: 1, medium: 2, low: 3 }
  const sortedActiveTasks = [...activeTasks].sort(
    (a, b) =>
      priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder],
  )
  const sortedCompletedTasks = [...completedTasks].sort(
    (a, b) =>
      priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder],
  )

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* ...loading skeleton... */}
      </div>
    )
  }

  // --- VISTA MÓVIL ---
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-4 pb-2 border-b border-border bg-white/80 dark:bg-zinc-950/80 sticky top-0 z-20">
          {/* Perfil usuario */}
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
            <DropdownMenuContent>
              <DropdownMenuItem>{user?.email}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/dashboard")}>Ir al dashboard</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/logout")}>Cerrar sesión</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Botón añadir tarea */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="rounded-lg ml-2">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nueva Tarea</DialogTitle>
                <DialogDescription>Agrega una nueva tarea a tu lista y establece su prioridad.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título de la Tarea</Label>
                  <Input
                    id="title"
                    placeholder="Título de la tarea"
                    value={newTask.title}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción (Opcional)</Label>
                  <Input
                    id="description"
                    placeholder="Descripción de la tarea"
                    value={newTask.description}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
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
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select
                      value={newTask.category}
                      onValueChange={(value) => setNewTask((prev) => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="work">Trabajo</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Pomodoros Estimados</Label>
                  <Select
                    value={newTask.estimated_pomodoros.toString()}
                    onValueChange={(value) => setNewTask((prev) => ({ ...prev, estimated_pomodoros: Number(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addTask} className="w-full">
                  Crear Tarea
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {/* Título y descripción centrados */}
        <div className="flex flex-col items-center text-center mt-4 mb-2 px-4">
          <h1 className="text-xl font-bold">Gestor de Tareas</h1>
          <p className="text-muted-foreground text-sm">
            {completedTasks.length} de {totalTasks} tareas completadas
          </p>
        </div>
        {/* Progreso general compacto */}
        <Card className="mx-2 mb-2">
          <CardHeader className="p-2 pb-0">
            <CardTitle className="flex items-center space-x-2 text-base">
              <CheckSquare className="w-5 h-5 text-primary" />
              <span>Progreso</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="flex justify-between text-xs">
              <span>Completadas</span>
              <span>
                {completedTasks.length}/{totalTasks}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-1 mt-1" />
          </CardContent>
        </Card>
        {/* Tareas activas y completadas en cuadrícula */}
        <div className="grid grid-cols-2 gap-2 px-2 pb-4">
          {/* Activas */}
          <div>
            <Card>
              <CardHeader className="p-2 pb-0">
                <CardTitle className="text-sm">Activas ({activeTasks.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-2">
                {sortedActiveTasks.length > 0 ? (
                  sortedActiveTasks.map((task) => (
                    <div key={task.id} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50">
                      <button onClick={() => toggleTask(task.id, task.completed)} className="flex-shrink-0">
                        <Circle className="w-4 h-4 text-gray-400 hover:text-primary transition-colors" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs">{task.title}</p>
                        {task.description && <p className="text-xs text-gray-600">{task.description}</p>}
                        <div className="flex items-center space-x-1 mt-1">
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
                          <span className="text-[10px] text-gray-500">{task.category === "work"
                            ? "Trabajo"
                            : task.category === "personal"
                            ? "Personal"
                            : "General"}</span>
                          <span className="text-[10px] text-gray-500">
                            🍅 {task.actual_pomodoros}/{task.estimated_pomodoros}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button variant="outline" size="icon" onClick={() => startPomodoro(task)}>
                          <Play className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditTask(task)
                                setIsEditDialogOpen(true)
                              }}
                            >
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500 text-xs">
                    <CheckSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No hay tareas activas
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Completadas */}
          <div>
            <Card>
              <CardHeader className="p-2 pb-0">
                <CardTitle className="text-sm">Completadas ({completedTasks.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-2">
                {sortedCompletedTasks.length > 0 ? (
                  sortedCompletedTasks.map((task) => (
                    <div key={task.id} className="flex items-center space-x-2 p-2 border rounded-lg bg-green-50">
                      <button onClick={() => toggleTask(task.id, task.completed)} className="flex-shrink-0">
                        <CheckSquare className="w-4 h-4 text-green-600" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium line-through text-gray-600">{task.title}</p>
                        {task.description && <p className="text-sm text-gray-500 line-through">{task.description}</p>}
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {task.priority === "high"
                              ? "Alta"
                              : task.priority === "medium"
                              ? "Media"
                              : "Baja"}
                          </Badge>
                          <span className="text-xs text-gray-500">{task.category === "work"
                            ? "Trabajo"
                            : task.category === "personal"
                            ? "Personal"
                            : "General"}</span>
                          <span className="text-xs text-gray-500">🍅 {task.actual_pomodoros}</span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500 text-xs">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    Aún no hay tareas completadas
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Dialog para editar tarea */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Tarea</DialogTitle>
              <DialogDescription>Modifica los detalles de esta tarea.</DialogDescription>
            </DialogHeader>
            {editTask && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Título</Label>
                  <Input
                    id="edit-title"
                    placeholder="Título de la tarea"
                    value={editTask.title}
                    onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Descripción (Opcional)</Label>
                  <Input
                    id="edit-description"
                    placeholder="Descripción de la tarea"
                    value={editTask.description}
                    onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prioridad</Label>
                    <Select
                      value={editTask.priority}
                      onValueChange={(value) => setEditTask({ ...editTask, priority: value })}
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
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select
                      value={editTask.category}
                      onValueChange={(value) => setEditTask({ ...editTask, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="work">Trabajo</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Pomodoros Estimados</Label>
                  <Select
                    value={editTask.estimated_pomodoros.toString()}
                    onValueChange={(value) => setEditTask({ ...editTask, estimated_pomodoros: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => updateTask(editTask.id, editTask)} className="w-full">
                  Guardar Cambios
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // --- VISTA ESCRITORIO (sin cambios) ---
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestor de Tareas</h1>
          <p className="text-gray-600">
            {completedTasks.length} de {totalTasks} tareas completadas
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Añadir Tarea
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Tarea</DialogTitle>
              <DialogDescription>Agrega una nueva tarea a tu lista y establece su prioridad.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título de la Tarea</Label>
                <Input
                  id="title"
                  placeholder="Título de la tarea"
                  value={newTask.title}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción (Opcional)</Label>
                <Input
                  id="description"
                  placeholder="Descripción de la tarea"
                  value={newTask.description}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
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
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select
                    value={newTask.category}
                    onValueChange={(value) => setNewTask((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work">Trabajo</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Pomodoros Estimados</Label>
                <Select
                  value={newTask.estimated_pomodoros.toString()}
                  onValueChange={(value) => setNewTask((prev) => ({ ...prev, estimated_pomodoros: Number(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addTask} className="w-full">
                Crear Tarea
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-primary" />
            <span>Progreso General</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Tareas Completadas</span>
              <span>
                {completedTasks.length}/{totalTasks}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Tareas Activas ({activeTasks.length})</CardTitle>
            <CardDescription>Tareas en las que estás trabajando actualmente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedActiveTasks.length > 0 ? (
              sortedActiveTasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <button onClick={() => toggleTask(task.id, task.completed)} className="flex-shrink-0">
                    <Circle className="w-5 h-5 text-gray-400 hover:text-primary transition-colors" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{task.title}</p>
                    {task.description && <p className="text-sm text-gray-600">{task.description}</p>}
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge
                        variant={
                          task.priority === "high"
                            ? "destructive"
                            : task.priority === "medium"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {task.priority === "high"
                          ? "Alta"
                          : task.priority === "medium"
                          ? "Media"
                          : "Baja"}
                      </Badge>
                      <span className="text-xs text-gray-500">{task.category === "work"
                        ? "Trabajo"
                        : task.category === "personal"
                        ? "Personal"
                        : "General"}</span>
                      <span className="text-xs text-gray-500">
                        🍅 {task.actual_pomodoros}/{task.estimated_pomodoros}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => startPomodoro(task)}>
                      <Play className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditTask(task)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No hay tareas activas</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Tareas Completadas ({completedTasks.length})</CardTitle>
            <CardDescription>Tareas que has finalizado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedCompletedTasks.length > 0 ? (
              sortedCompletedTasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-3 p-3 border rounded-lg bg-green-50">
                  <button onClick={() => toggleTask(task.id, task.completed)} className="flex-shrink-0">
                    <CheckSquare className="w-5 h-5 text-green-600" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-through text-gray-600">{task.title}</p>
                    {task.description && <p className="text-sm text-gray-500 line-through">{task.description}</p>}
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {task.priority === "high"
                          ? "Alta"
                          : task.priority === "medium"
                          ? "Media"
                          : "Baja"}
                      </Badge>
                      <span className="text-xs text-gray-500">{task.category === "work"
                        ? "Trabajo"
                        : task.category === "personal"
                        ? "Personal"
                        : "General"}</span>
                      <span className="text-xs text-gray-500">🍅 {task.actual_pomodoros}</span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aún no hay tareas completadas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Dialog para editar tarea */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tarea</DialogTitle>
            <DialogDescription>Modifica los detalles de esta tarea.</DialogDescription>
          </DialogHeader>
          {editTask && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Título</Label>
                <Input
                  id="edit-title"
                  placeholder="Título de la tarea"
                  value={editTask.title}
                  onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción (Opcional)</Label>
                <Input
                  id="edit-description"
                  placeholder="Descripción de la tarea"
                  value={editTask.description}
                  onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select
                    value={editTask.priority}
                    onValueChange={(value) => setEditTask({ ...editTask, priority: value })}
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
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select
                    value={editTask.category}
                    onValueChange={(value) => setEditTask({ ...editTask, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work">Trabajo</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Pomodoros Estimados</Label>
                <Select
                  value={editTask.estimated_pomodoros.toString()}
                  onValueChange={(value) => setEditTask({ ...editTask, estimated_pomodoros: Number(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => updateTask(editTask.id, editTask)} className="w-full">
                Guardar Cambios
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
