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
      <main>
        <HeroSection />
        <FeaturesSection />
        <AISection />
        <TasksSection />
        <PomodoroSection />
      </main>
      <Footer />
    </div>
  )
}
