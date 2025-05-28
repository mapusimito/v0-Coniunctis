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
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

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
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-2"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
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
