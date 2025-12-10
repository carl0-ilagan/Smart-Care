/**
 * Sentiment Analysis using Google Gemini AI
 */

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`

/**
 * Analyze sentiment of feedback text using Gemini AI
 * @param {string} text - The feedback text to analyze
 * @returns {Promise<{sentiment: string, score: number, confidence: number, summary: string}>}
 */
export async function analyzeSentiment(text) {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return {
      sentiment: "neutral",
      score: 0,
      confidence: 0,
      summary: "No text provided for analysis",
    }
  }

  // Check if API key is available
  if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === "") {
    console.warn("Gemini API key not found. Using fallback sentiment analysis.")
    // Use fallback keyword-based analysis
    return analyzeSentimentFallback(text)
  }

  try {
    const prompt = `Analyze the sentiment of the following feedback text. Respond with a JSON object containing:
- "sentiment": one of "positive", "negative", or "neutral"
- "score": a number between -1 (very negative) and 1 (very positive)
- "confidence": a number between 0 and 1 indicating confidence level
- "summary": a brief one-sentence summary of the sentiment

Feedback text: "${text}"

Respond ONLY with valid JSON, no additional text.`

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Gemini API error:", errorData)
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error("Invalid response from Gemini API")
    }

    const responseText = data.candidates[0].content.parts[0].text.trim()

    // Try to extract JSON from the response
    let sentimentData
    try {
      // Remove markdown code blocks if present
      const cleanedText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      sentimentData = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", responseText)
      // Use fallback analysis
      return analyzeSentimentFallback(text)
    }

    // Validate and normalize the response
    const sentiment = ["positive", "negative", "neutral"].includes(sentimentData.sentiment)
      ? sentimentData.sentiment
      : "neutral"
    const score = typeof sentimentData.score === "number" ? Math.max(-1, Math.min(1, sentimentData.score)) : 0
    const confidence = typeof sentimentData.confidence === "number" ? Math.max(0, Math.min(1, sentimentData.confidence)) : 0.5
    const summary = typeof sentimentData.summary === "string" ? sentimentData.summary : "Sentiment analyzed"

    return {
      sentiment,
      score,
      confidence,
      summary,
    }
  } catch (error) {
    console.error("Error analyzing sentiment:", error)
    // Use fallback analysis on error
    return analyzeSentimentFallback(text)
  }
}

/**
 * Fallback sentiment analysis using keyword matching
 * @param {string} text - The feedback text to analyze
 * @returns {{sentiment: string, score: number, confidence: number, summary: string}}
 */
function analyzeSentimentFallback(text) {
  const lowerText = text.toLowerCase()
  let sentiment = "neutral"
  let score = 0

  // Simple keyword-based fallback
  const positiveWords = ["good", "great", "excellent", "amazing", "wonderful", "love", "happy", "satisfied", "thank", "helpful", "perfect", "awesome", "fantastic", "brilliant", "outstanding"]
  const negativeWords = ["bad", "terrible", "awful", "hate", "disappointed", "poor", "worst", "problem", "issue", "complaint", "horrible", "frustrated", "angry", "upset", "dissatisfied"]

  const positiveCount = positiveWords.filter((word) => lowerText.includes(word)).length
  const negativeCount = negativeWords.filter((word) => lowerText.includes(word)).length

  if (positiveCount > negativeCount) {
    sentiment = "positive"
    score = Math.min(0.7, positiveCount * 0.2)
  } else if (negativeCount > positiveCount) {
    sentiment = "negative"
    score = Math.max(-0.7, -negativeCount * 0.2)
  }

  return {
    sentiment,
    score,
    confidence: 0.5,
    summary: `Detected ${sentiment} sentiment based on keywords`,
  }
}

/**
 * Get sentiment color and icon based on sentiment
 * @param {string} sentiment - The sentiment value
 * @returns {{color: string, bgColor: string, icon: string}}
 */
export function getSentimentStyle(sentiment) {
  switch (sentiment) {
    case "positive":
      return {
        color: "text-green-700",
        bgColor: "bg-green-100",
        icon: "😊",
        label: "Positive",
        gradient: "from-green-400 to-green-600",
      }
    case "negative":
      return {
        color: "text-red-700",
        bgColor: "bg-red-100",
        icon: "😞",
        label: "Negative",
        gradient: "from-red-400 to-red-600",
      }
    default:
      return {
        color: "text-gray-700",
        bgColor: "bg-gray-100",
        icon: "😐",
        label: "Neutral",
        gradient: "from-gray-400 to-gray-600",
      }
  }
}

