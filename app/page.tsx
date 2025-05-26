import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, CheckSquare, Clock, Sparkles } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Coniunctis
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-gray-600 hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="text-gray-600 hover:text-primary transition-colors">
              Sign In
            </Link>
            <Button asChild>
              <Link href="/login">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Escribe de manera inteligente, <br />
          <br />
          Trabaja de manera inteligente
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Coniunctis combines AI-powered writing assistance with intelligent task management to boost your productivity
          like never before.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild className="bg-primary hover:bg-primary/90">
            <Link href="/login">Start Writing for Free</Link>
          </Button>
          <Button size="lg" variant="outline">
            Watch Demo
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Everything you need to be productive</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Editor</h3>
              <p className="text-gray-600">
                Write with confidence using our intelligent assistant that helps with grammar, style, and content
                suggestions in real-time.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Task Manager</h3>
              <p className="text-gray-600">
                Organize your work with intelligent task prioritization and seamless integration with your documents.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pomodoro Integration</h3>
              <p className="text-gray-600">
                Stay focused with built-in time management tools that adapt to your workflow and boost concentration.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-secondary py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to transform your productivity?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of writers and professionals who trust Coniunctis.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/login">Get Started Today</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold">Coniunctis</span>
          </div>
          <div className="text-center text-gray-400">
            <p>&copy; 2024 Coniunctis. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
