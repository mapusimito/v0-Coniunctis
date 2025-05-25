import {
  useAssistant,
  generateTitle as generateTitleAction,
  useProducer,
  testGeminiConnection,
} from "@/app/actions/ai-actions"

export class AIService {
  private static instance: AIService

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  // Assistant functions
  async checkGrammar(text: string): Promise<string> {
    const assistant = useAssistant // Ensure hook is called at the top level
    try {
      return await assistant(text, "grammar")
    } catch (error) {
      throw new Error("Error al revisar gramática")
    }
  }

  async explainText(text: string): Promise<string> {
    const assistant = useAssistant // Ensure hook is called at the top level
    try {
      return await assistant(text, "explain")
    } catch (error) {
      throw new Error("Error al explicar texto")
    }
  }

  async simplifyText(text: string): Promise<string> {
    const assistant = useAssistant // Ensure hook is called at the top level
    try {
      return await assistant(text, "simple")
    } catch (error) {
      throw new Error("Error al simplificar texto")
    }
  }

  async complexifyText(text: string): Promise<string> {
    const assistant = useAssistant // Ensure hook is called at the top level
    try {
      return await assistant(text, "complex")
    } catch (error) {
      throw new Error("Error al hacer más complejo el texto")
    }
  }

  // Title generator
  async generateTitle(content: string): Promise<string> {
    try {
      return await generateTitleAction(content)
    } catch (error) {
      return "Documento sin título"
    }
  }

  // Producer functions
  async expandText(text: string): Promise<string> {
    const producer = useProducer // Ensure hook is called at the top level
    try {
      return await producer(text, "expand")
    } catch (error) {
      throw new Error("Error al expandir texto")
    }
  }

  async generateContent(text: string): Promise<string> {
    const producer = useProducer // Ensure hook is called at the top level
    try {
      return await producer(text, "generate")
    } catch (error) {
      throw new Error("Error al generar contenido")
    }
  }

  async createScheme(topic: string): Promise<string> {
    const producer = useProducer // Ensure hook is called at the top level
    try {
      return await producer(topic, "scheme")
    } catch (error) {
      throw new Error("Error al crear esquema")
    }
  }

  // Test connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    return await testGeminiConnection()
  }
}
