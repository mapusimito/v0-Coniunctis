"use server"

interface AIResponse {
  suggestion: string
  type: "grammar" | "style" | "content" | "structure"
}

async function callGemini(messages: any[], maxTokens = 300): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable not found")
    throw new Error("Gemini API key no configurada")
  }

  try {
    const prompt = messages.map((m: any) => m.content).join("\n\n")

    const requestBody = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Gemini API error ${response.status}:`, errorText)
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()

    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content ||
      !data.candidates[0].content.parts ||
      !data.candidates[0].content.parts[0] ||
      !data.candidates[0].content.parts[0].text
    ) {
      if (data.candidates && data.candidates[0] && data.candidates[0].finishReason === "SAFETY") {
        throw new Error("Contenido bloqueado por filtros de seguridad")
      }
      throw new Error("Respuesta inválida de Gemini API")
    }

    return data.candidates[0].content.parts[0].text.trim()
  } catch (error) {
    console.error("Gemini API call failed:", error)
    throw error
  }
}

// 1. ASSISTANT FUNCTION - Grammar, Explain, Rewrite
export async function useAssistant(
  text: string,
  action: "grammar" | "explain" | "simple" | "complex",
): Promise<string> {
  try {
    let systemPrompt = ""
    let userPrompt = ""

    switch (action) {
      case "grammar":
        systemPrompt =
          "Eres un corrector de gramática en español. Corrige los errores gramaticales y de ortografía del texto. Devuelve solo el texto corregido, sin explicaciones."
        userPrompt = `Corrige este texto: "${text}"`
        break
      case "explain":
        systemPrompt =
          "Eres un profesor que explica conceptos de manera clara y sencilla en español. Explica el contenido del texto de forma didáctica."
        userPrompt = `Explica este texto: "${text}"`
        break
      case "simple":
        systemPrompt =
          "Eres un editor que simplifica textos en español. Reescribe el texto de manera más simple y fácil de entender, manteniendo el significado."
        userPrompt = `Simplifica este texto: "${text}"`
        break
      case "complex":
        systemPrompt =
          "Eres un editor que enriquece textos en español. Reescribe el texto de manera más elaborada y sofisticada, manteniendo el significado."
        userPrompt = `Haz más complejo este texto: "${text}"`
        break
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]

    return await callGemini(messages, 400)
  } catch (error) {
    console.error(`Error in useAssistant (${action}):`, error)
    return "Error al procesar el texto. Por favor, inténtalo más tarde."
  }
}

// 2. TITLE GENERATOR FUNCTION
export async function generateTitle(content: string): Promise<string> {
  try {
    const messages = [
      {
        role: "system",
        content:
          "Eres un generador de títulos en español. Crea un título conciso y atractivo para el contenido. Devuelve solo el título, sin comillas.",
      },
      {
        role: "user",
        content: `Genera un título para este contenido: "${content.substring(0, 500)}..."`,
      },
    ]

    const title = await callGemini(messages, 50)
    return title.replace(/["""'']/g, "").trim() || "Documento sin título"
  } catch (error) {
    console.error("Error in generateTitle:", error)
    return "Documento sin título"
  }
}

// 3. PRODUCER FUNCTION - Expand, Generate, Scheme
export async function useProducer(prompt: string, action: "expand" | "generate" | "scheme"): Promise<string> {
  try {
    let systemPrompt = ""
    let userPrompt = ""

    switch (action) {
      case "expand":
        systemPrompt =
          "Eres un escritor creativo en español. Expande el texto agregando más detalles, ejemplos y explicaciones manteniendo el estilo original."
        userPrompt = `Expande este texto: "${prompt}"`
        break
      case "generate":
        systemPrompt =
          "Eres un escritor creativo en español. Continúa el texto de forma natural y coherente, manteniendo el estilo y tono."
        userPrompt = `Continúa este texto: "${prompt}"`
        break
      case "scheme":
        systemPrompt =
          "Eres un organizador de contenido en español. Crea un esquema estructurado para el tema. Usa formato de lista con viñetas (-)."
        userPrompt = `Crea un esquema para: "${prompt}"`
        break
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]

    return await callGemini(messages, 500)
  } catch (error) {
    console.error(`Error in useProducer (${action}):`, error)
    return "Error al generar contenido. Por favor, inténtalo más tarde."
  }
}

// 4. PRODUCTIVITY INSIGHT FUNCTION
export async function generateProductivityInsight(userStats: any): Promise<string> {
  try {
    const messages = [
      {
        role: "system",
        content:
          "Eres un coach de productividad en español. Analiza las estadísticas del usuario y proporciona un insight útil y motivador en 1-2 oraciones.",
      },
      {
        role: "user",
        content: `Analiza estas estadísticas: ${JSON.stringify(userStats)}. Proporciona un insight de productividad.`,
      },
    ]

    return await callGemini(messages, 150)
  } catch (error) {
    console.error("Error in generateProductivityInsight:", error)
    return "¡Sigue así! Tu constancia es la clave del éxito."
  }
}

// 5. WEEKLY SUMMARY FUNCTION
export async function generateWeeklySummary(weeklyStats: any): Promise<string> {
  try {
    const messages = [
      {
        role: "system",
        content:
          "Eres un analista de productividad en español. Crea un resumen semanal motivador basado en las estadísticas. Máximo 3 oraciones.",
      },
      {
        role: "user",
        content: `Crea un resumen semanal para estas estadísticas: ${JSON.stringify(weeklyStats)}`,
      },
    ]

    return await callGemini(messages, 200)
  } catch (error) {
    console.error("Error in generateWeeklySummary:", error)
    return "Esta semana has hecho un gran progreso. ¡Continúa con el buen trabajo!"
  }
}

// Test function
export async function testGeminiConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const testMessage = [
      {
        role: "system",
        content: "Responde con 'Conexión exitosa con Gemini Flash 2.0' si puedes leer este mensaje.",
      },
      {
        role: "user",
        content: "Prueba de conexión",
      },
    ]

    const response = await callGemini(testMessage, 50)

    return {
      success: true,
      message: `Gemini Flash 2.0 conectado: ${response}`,
    }
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
    }
  }
}
