import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { AISection } from "@/components/landing/ai-section"
import { TasksSection } from "@/components/landing/tasks-section"
import { PomodoroSection } from "@/components/landing/pomodoro-section"
import { Footer } from "@/components/landing/footer"
import { Header } from "@/components/landing/header"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-8">
        <div className="block sm:hidden text-[15px] leading-tight">
          {/* En móvil, todo el contenido se verá más pequeño y compacto */}
          <HeroSection />
          <FeaturesSection />
          <AISection />
          <TasksSection />
          <PomodoroSection />
        </div>
        <div className="hidden sm:block">
          {/* Escritorio, vista normal */}
          <HeroSection />
          <FeaturesSection />
          <AISection />
          <TasksSection />
          <PomodoroSection />
        </div>
      </main>
      <Footer />
    </div>
  )
}
