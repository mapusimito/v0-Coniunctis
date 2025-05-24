"use server"

interface AIResponse {
  suggestion: string
  type: "grammar" | "style" | "content" | "structure"
}

async function callOpenAI(messages: any[], maxTokens = 150): Promise<string> {
  // Use server-only environment variable (without NEXT_PUBLIC_ prefix)
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error("OpenAI API key not configured")
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || "No response generated"
  } catch (error) {
    console.error("OpenAI API call failed:", error)
    throw error
  }
}

export async function getSuggestion(text: string, context = "general"): Promise<AIResponse> {
  try {
    const messages = [
      {
        role: "system",
        content: `You are a professional writing assistant. Analyze the given text and provide ONE specific, actionable suggestion to improve it. Focus on one of these areas: grammar, style, content, or structure. Be concise and helpful.`,
      },
      {
        role: "user",
        content: `Please analyze this text and provide a specific improvement suggestion: "${text}"`,
      },
    ]

    const suggestion = await callOpenAI(messages, 100)

    // Determine the type based on keywords in the suggestion
    let type: "grammar" | "style" | "content" | "structure" = "content"
    const lowerSuggestion = suggestion.toLowerCase()

    if (lowerSuggestion.includes("grammar") || lowerSuggestion.includes("tense") || lowerSuggestion.includes("verb")) {
      type = "grammar"
    } else if (
      lowerSuggestion.includes("style") ||
      lowerSuggestion.includes("tone") ||
      lowerSuggestion.includes("voice")
    ) {
      type = "style"
    } else if (
      lowerSuggestion.includes("structure") ||
      lowerSuggestion.includes("paragraph") ||
      lowerSuggestion.includes("organize")
    ) {
      type = "structure"
    }

    return { suggestion, type }
  } catch (error) {
    return {
      suggestion: "Sorry, AI assistance is temporarily unavailable. Please try again later.",
      type: "content",
    }
  }
}

export async function improveText(text: string): Promise<string> {
  try {
    const messages = [
      {
        role: "system",
        content: `You are a professional editor. Improve the given text by making it clearer, more concise, and better written while preserving the original meaning and tone. Return only the improved text without explanations.`,
      },
      {
        role: "user",
        content: `Please improve this text: "${text}"`,
      },
    ]

    return await callOpenAI(messages, 200)
  } catch (error) {
    throw new Error("Failed to improve text")
  }
}

export async function generateContent(prompt: string, type: "continue" | "expand" | "summarize"): Promise<string> {
  try {
    let systemPrompt = ""
    let userPrompt = ""

    switch (type) {
      case "continue":
        systemPrompt =
          "You are a creative writing assistant. Continue the given text in a natural, coherent way that matches the style and tone. Write 2-3 sentences that flow naturally from the existing content."
        userPrompt = `Please continue this text: "${prompt}"`
        break
      case "expand":
        systemPrompt =
          "You are a writing assistant. Expand on the given text by adding more details, examples, or explanations while maintaining the original meaning and style."
        userPrompt = `Please expand on this text with more details: "${prompt}"`
        break
      case "summarize":
        systemPrompt =
          "You are a summarization expert. Create a concise summary that captures the key points of the given text."
        userPrompt = `Please summarize this text: "${prompt}"`
        break
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]

    return await callOpenAI(messages, 300)
  } catch (error) {
    throw new Error(`Failed to ${type} content`)
  }
}

export async function generateTitle(content: string): Promise<string> {
  try {
    const messages = [
      {
        role: "system",
        content:
          "You are a title generator. Create a concise, descriptive title for the given content. Return only the title, no quotes or explanations.",
      },
      {
        role: "user",
        content: `Generate a title for this content: "${content.substring(0, 500)}..."`,
      },
    ]

    return await callOpenAI(messages, 50)
  } catch (error) {
    return "Untitled Document"
  }
}

export async function checkGrammar(
  text: string,
): Promise<{ errors: Array<{ text: string; suggestion: string; position: number }> }> {
  try {
    const messages = [
      {
        role: "system",
        content: `You are a grammar checker. Identify grammar errors in the text and provide corrections. Format your response as JSON with an array of errors, each containing: text (the error), suggestion (the correction), and position (approximate character position). If no errors, return {"errors": []}.`,
      },
      {
        role: "user",
        content: `Check grammar in this text: "${text}"`,
      },
    ]

    const response = await callOpenAI(messages, 200)

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
          "You are an outline generator. Create a logical outline for the given topic. Return only the outline points as a JSON array of strings.",
      },
      {
        role: "user",
        content: `Create an outline for: "${topic}"`,
      },
    ]

    const response = await callOpenAI(messages, 150)

    try {
      return JSON.parse(response)
    } catch {
      return ["Introduction", "Main Points", "Conclusion"]
    }
  } catch (error) {
    return ["Introduction", "Main Points", "Conclusion"]
  }
}

export async function generateProductivityInsight(userStats: any): Promise<string> {
  try {
    const messages = [
      {
        role: "system",
        content:
          "You are a productivity coach. Generate a brief, motivational insight based on user statistics. Be encouraging and provide actionable advice.",
      },
      {
        role: "user",
        content: `User completed ${userStats.tasksCompleted} tasks, wrote ${userStats.wordsWritten} words, and spent ${userStats.focusTime} hours focusing today. Generate a motivational productivity insight.`,
      },
    ]

    return await callOpenAI(messages, 100)
  } catch (error) {
    return "Keep up the great work! Every step forward is progress toward your goals."
  }
}

export async function generateWeeklySummary(weeklyStats: any): Promise<string> {
  try {
    const summaryPrompt = `Generate a brief weekly productivity summary for a user who: completed ${weeklyStats.tasksCompleted} tasks, wrote ${weeklyStats.totalWords} words, spent ${weeklyStats.focusHours} hours focusing, and worked on ${weeklyStats.projectsWorked} projects. Include encouragement and a suggestion for next week.`

    const messages = [
      {
        role: "system",
        content:
          "You are a productivity coach. Create an encouraging weekly summary with insights and suggestions for improvement.",
      },
      {
        role: "user",
        content: summaryPrompt,
      },
    ]

    return await callOpenAI(messages, 200)
  } catch (error) {
    return `This week you completed ${weeklyStats.tasksCompleted} tasks and wrote ${weeklyStats.totalWords} words. Great work!`
  }
}
