import {
  getSuggestion as getSuggestionAction,
  improveText as improveTextAction,
  generateContent as generateContentAction,
  generateTitle as generateTitleAction,
  checkGrammar as checkGrammarAction,
  generateOutline as generateOutlineAction,
  generateProductivityInsight as generateProductivityInsightAction,
  generateWeeklySummary as generateWeeklySummaryAction,
} from "@/app/actions/ai-actions"

interface AIResponse {
  suggestion: string
  type: "grammar" | "style" | "content" | "structure"
}

export class AIService {
  private static instance: AIService

  private constructor() {
    // No API key needed on client side anymore
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  async getSuggestion(text: string, context = "general"): Promise<AIResponse> {
    try {
      return await getSuggestionAction(text, context)
    } catch (error) {
      return {
        suggestion: "Sorry, AI assistance is temporarily unavailable. Please try again later.",
        type: "content",
      }
    }
  }

  async improveText(text: string): Promise<string> {
    try {
      return await improveTextAction(text)
    } catch (error) {
      throw new Error("Failed to improve text")
    }
  }

  async generateContent(prompt: string, type: "continue" | "expand" | "summarize"): Promise<string> {
    try {
      return await generateContentAction(prompt, type)
    } catch (error) {
      throw new Error(`Failed to ${type} content`)
    }
  }

  async generateTitle(content: string): Promise<string> {
    try {
      return await generateTitleAction(content)
    } catch (error) {
      return "Untitled Document"
    }
  }

  async checkGrammar(text: string): Promise<{ errors: Array<{ text: string; suggestion: string; position: number }> }> {
    try {
      return await checkGrammarAction(text)
    } catch (error) {
      return { errors: [] }
    }
  }

  async generateOutline(topic: string): Promise<string[]> {
    try {
      return await generateOutlineAction(topic)
    } catch (error) {
      return ["Introduction", "Main Points", "Conclusion"]
    }
  }

  async generateProductivityInsight(userStats: any): Promise<string> {
    try {
      return await generateProductivityInsightAction(userStats)
    } catch (error) {
      return "Keep up the great work! Every step forward is progress toward your goals."
    }
  }

  async generateWeeklySummary(weeklyStats: any): Promise<string> {
    try {
      return await generateWeeklySummaryAction(weeklyStats)
    } catch (error) {
      return `This week you completed ${weeklyStats.tasksCompleted} tasks and wrote ${weeklyStats.totalWords} words. Great work!`
    }
  }
}
