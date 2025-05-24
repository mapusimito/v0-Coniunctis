"use server"

interface AIResponse {
  suggestion: string
  type: "grammar" | "style" | "content" | "structure"
}

// Cambia esta función para usar la API de Gemini en vez de OpenAI
async function callGemini(messages: any[], maxTokens = 150): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error("Gemini API key no configurada")
  }

  try {
    // Gemini espera un solo prompt, así que concatenamos los mensajes
    const prompt = messages.map((m: any) => m.content).join("\n")

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + apiKey, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.7
        }
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    // Gemini responde en data.candidates[0].content.parts[0].text
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No se generó respuesta"
  } catch (error) {
    console.error("Gemini API call failed:", error)
    throw error
  }
}

// Todas las funciones siguientes usan callGemini en vez de callOpenAI

export async function getSuggestion(text: string, context = "general"): Promise<AIResponse> {
  try {
    const messages = [
      {
        role: "system",
        content: `Eres un asistente profesional de escritura. Analiza el texto dado y proporciona UNA sugerencia específica y accionable para mejorarlo. Concéntrate en una de estas áreas: gramática, estilo, contenido o estructura. Sé conciso y útil.`,
      },
      {
        role: "user",
        content: `Por favor analiza este texto y proporciona una sugerencia de mejora específica: "${text}"`,
      },
    ]

    const suggestion = await callGemini(messages, 100)

    // Determinar el tipo basado en palabras clave en la sugerencia
    let type: "grammar" | "style" | "content" | "structure" = "content"
    const lowerSuggestion = suggestion.toLowerCase()

    if (lowerSuggestion.includes("gramática") || lowerSuggestion.includes("tiempo verbal") || lowerSuggestion.includes("verbo")) {
      type = "grammar"
    } else if (
      lowerSuggestion.includes("estilo") ||
      lowerSuggestion.includes("tono") ||
      lowerSuggestion.includes("voz")
    ) {
      type = "style"
    } else if (
      lowerSuggestion.includes("estructura") ||
      lowerSuggestion.includes("párrafo") ||
      lowerSuggestion.includes("organiza")
    ) {
      type = "structure"
    }

    return { suggestion, type }
  } catch (error) {
    return {
      suggestion: "Lo siento, la asistencia de IA no está disponible temporalmente. Por favor, inténtalo más tarde.",
      type: "content",
    }
  }
}

export async function improveText(text: string): Promise<string> {
  try {
    const messages = [
      {
        role: "system",
        content: `Eres un editor profesional. Mejora el texto dado haciéndolo más claro, conciso y mejor redactado, preservando el significado y tono original. Devuelve solo el texto mejorado sin explicaciones.`,
      },
      {
        role: "user",
        content: `Por favor mejora este texto: "${text}"`,
      },
    ]

    return await callGemini(messages, 200)
  } catch (error) {
    throw new Error("No se pudo mejorar el texto")
  }
}

export async function generateContent(prompt: string, type: "continue" | "expand" | "summarize"): Promise<string> {
  try {
    let systemPrompt = ""
    let userPrompt = ""

    switch (type) {
      case "continue":
        systemPrompt =
          "Eres un asistente creativo de escritura. Continúa el texto dado de forma natural y coherente que coincida con el estilo y tono. Escribe 2-3 frases que fluyan naturalmente del contenido existente."
        userPrompt = `Por favor continúa este texto: "${prompt}"`
        break
      case "expand":
        systemPrompt =
          "Eres un asistente de escritura. Expande el texto dado agregando más detalles, ejemplos o explicaciones, manteniendo el significado y estilo original."
        userPrompt = `Por favor expande este texto con más detalles: "${prompt}"`
        break
      case "summarize":
        systemPrompt =
          "Eres un experto en resúmenes. Crea un resumen conciso que capture los puntos clave del texto dado."
        userPrompt = `Por favor resume este texto: "${prompt}"`
        break
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]

    return await callGemini(messages, 300)
  } catch (error) {
    throw new Error(`No se pudo ${type} el contenido`)
  }
}

export async function generateTitle(content: string): Promise<string> {
  try {
    const messages = [
      {
        role: "system",
        content:
          "Eres un generador de títulos. Crea un título conciso y descriptivo para el contenido dado. Devuelve solo el título, sin comillas ni explicaciones.",
      },
      {
        role: "user",
        content: `Genera un título para este contenido: "${content.substring(0, 500)}..."`,
      },
    ]

    return await callGemini(messages, 50)
  } catch (error) {
    return "Documento sin título"
  }
}

export async function checkGrammar(
  text: string,
): Promise<{ errors: Array<{ text: string; suggestion: string; position: number }> }> {
  try {
    const messages = [
      {
        role: "system",
        content: `Eres un corrector gramatical. Identifica errores de gramática en el texto y proporciona correcciones. Formatea tu respuesta como JSON con un array de errores, cada uno con: text (el error), suggestion (la corrección) y position (posición aproximada del carácter). Si no hay errores, devuelve {"errors": []}.`,
      },
      {
        role: "user",
        content: `Revisa la gramática de este texto: "${text}"`,
      },
    ]

    const response = await callGemini(messages, 200)

    try {
      return JSON.parse(response)
    } catch {
      return { errors: [] }
    }
  } catch (error) {
    return { errors: [] }
  }
}

export async function generateOutline(topic: string): Promise<string[]> {
  try {
    const messages = [
      {
        role: "system",
        content:
          "Eres un generador de esquemas. Crea un esquema lógico para el tema dado. Devuelve solo los puntos del esquema como un array JSON de cadenas.",
      },
      {
        role: "user",
        content: `Crea un esquema para: "${topic}"`,
      },
    ]

    const response = await callGemini(messages, 150)

    try {
      return JSON.parse(response)
    } catch {
      return ["Introducción", "Puntos principales", "Conclusión"]
    }
  } catch (error) {
    return ["Introducción", "Puntos principales", "Conclusión"]
  }
}

export async function generateProductivityInsight(userStats: any): Promise<string> {
  try {
    const messages = [
      {
        role: "system",
        content:
          "Eres un coach de productividad. Genera una breve reflexión motivacional basada en las estadísticas del usuario. Sé alentador y proporciona un consejo accionable.",
      },
      {
        role: "user",
        content: `El usuario completó ${userStats.tasksCompleted} tareas, escribió ${userStats.wordsWritten} palabras y pasó ${userStats.focusTime} horas concentrado hoy. Genera una reflexión motivacional de productividad.`,
      },
    ]

    return await callGemini(messages, 100)
  } catch (error) {
    return "¡Sigue así! Cada paso adelante es progreso hacia tus metas."
  }
}

export async function generateWeeklySummary(weeklyStats: any): Promise<string> {
  try {
    const summaryPrompt = `Genera un breve resumen semanal de productividad para un usuario que: completó ${weeklyStats.tasksCompleted} tareas, escribió ${weeklyStats.totalWords} palabras, pasó ${weeklyStats.focusHours} horas concentrado y trabajó en ${weeklyStats.projectsWorked} proyectos. Incluye ánimo y una sugerencia para la próxima semana.`

    const messages = [
      {
        role: "system",
        content:
          "Eres un coach de productividad. Crea un resumen semanal alentador con ideas y sugerencias de mejora.",
      },
      {
        role: "user",
        content: summaryPrompt,
      },
    ]

    return await callGemini(messages, 200)
  } catch (error) {
    return `Esta semana completaste ${weeklyStats.tasksCompleted} tareas y escribiste ${weeklyStats.totalWords} palabras. ¡Buen trabajo!`
  }
}
