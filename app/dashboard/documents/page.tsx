"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileText, Search, Plus, MoreHorizontal, Star, Share, Trash2, Clock, Edit } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabaseClient"

interface Document {
  id: string
  title: string
  type: string
  updated_at: string
  word_count: number
  status: string
  starred: boolean
  shared: boolean
  project_tag: string
  progress_percentage: number
}

export default function DocumentsPage() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [filterBy, setFilterBy] = useState("all")

  useEffect(() => {
    if (user) {
      fetchDocuments()
    }
  }, [user])

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user?.id)
        .order("updated_at", { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error("Error fetching documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteDocument = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return

    try {
      const { error } = await supabase.from("documents").delete().eq("id", id)

      if (error) throw error

      setDocuments(documents.filter((doc) => doc.id !== id))
    } catch (error) {
      console.error("Error deleting document:", error)
    }
  }

  const toggleStar = async (id: string, starred: boolean) => {
    try {
      const { error } = await supabase.from("documents").update({ starred: !starred }).eq("id", id)

      if (error) throw error

      setDocuments(documents.map((doc) => (doc.id === id ? { ...doc, starred: !starred } : doc)))
    } catch (error) {
      console.error("Error updating document:", error)
    }
  }

  const filteredDocuments = documents
    .filter((doc) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.project_tag.toLowerCase().includes(searchTerm.toLowerCase())

      if (filterBy === "all") return matchesSearch
      if (filterBy === "starred") return matchesSearch && doc.starred
      if (filterBy === "recent")
        return matchesSearch && new Date(doc.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      return matchesSearch && doc.project_tag.toLowerCase() === filterBy
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "alphabetical":
          return a.title.localeCompare(b.title)
        case "wordcount":
          return b.word_count - a.word_count
        case "progress":
          return b.progress_percentage - a.progress_percentage
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
    })

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return "1 day ago"
    return `${diffInDays} days ago`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      case "review":
        return "bg-purple-100 text-purple-800"
      case "published":
        return "bg-emerald-100 text-emerald-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

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
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-gray-600">{filteredDocuments.length} documents found</p>
        </div>
        <Link href="/dashboard/editor">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            New Document
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
              <SelectItem value="wordcount">Word Count</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="starred">Starred</SelectItem>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="work">Work</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="research">Research</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((doc) => (
          <Card key={doc.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex items-center space-x-1">
                    {doc.starred && (
                      <button onClick={() => toggleStar(doc.id, doc.starred)}>
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      </button>
                    )}
                    {doc.shared && <Share className="w-4 h-4 text-blue-500" />}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/editor?id=${doc.id}`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleStar(doc.id, doc.starred)}>
                      <Star className="w-4 h-4 mr-2" />
                      {doc.starred ? "Remove from favorites" : "Add to favorites"}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share className="w-4 h-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => deleteDocument(doc.id)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Link href={`/dashboard/editor?id=${doc.id}`}>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary transition-colors">
                      {doc.title}
                    </h3>
                    <p className="text-sm text-gray-600">{doc.project_tag}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge className={`text-xs ${getStatusColor(doc.status)}`}>{doc.status.replace("_", " ")}</Badge>
                    <span className="text-xs text-gray-500">{doc.word_count} words</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{doc.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${doc.progress_percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center text-xs text-gray-500 space-x-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{getTimeAgo(doc.updated_at)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            {searchTerm ? "No documents found" : "No documents yet"}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? "Try adjusting your search terms or filters." : "Create your first document to get started."}
          </p>
          <Link href="/dashboard/editor">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Document
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
