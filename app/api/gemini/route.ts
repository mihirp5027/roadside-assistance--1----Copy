import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: Request) {
  try {
    console.log('Received request to /api/gemini')
    
    const body = await request.json()
    console.log('Request body:', body)

    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set')
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      )
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    // Generate content
    const result = await model.generateContent(body.prompt)
    const response = await result.response
    const text = response.text()
    
    console.log('Raw Gemini response:', text)

    // Parse the response into structured data
    const lines = text.split('\n').filter(line => line.trim())
    
    const solution = {
      advice: "",
      recommendations: [],
      urgencyLevel: "Medium",
      nextSteps: []
    }

    let currentSection = ""
    
    for (const line of lines) {
      if (line.toLowerCase().includes("initial advice") || line.toLowerCase().includes("medical advice")) {
        currentSection = "advice"
        continue
      } else if (line.toLowerCase().includes("recommend")) {
        currentSection = "recommendations"
        continue
      } else if (line.toLowerCase().includes("urgency") || line.toLowerCase().includes("severity")) {
        currentSection = "urgency"
        continue
      } else if (line.toLowerCase().includes("next steps") || line.toLowerCase().includes("what to do")) {
        currentSection = "nextSteps"
        continue
      }

      // Clean up the line
      const cleanLine = line.replace(/^\d+[\.)]\s*/, "").trim()
      if (!cleanLine) continue

      switch (currentSection) {
        case "advice":
          solution.advice = cleanLine
          break
        case "recommendations":
          solution.recommendations.push(cleanLine)
          break
        case "urgency":
          if (cleanLine.toLowerCase().includes("high") || cleanLine.toLowerCase().includes("severe")) {
            solution.urgencyLevel = "High"
          } else if (cleanLine.toLowerCase().includes("low") || cleanLine.toLowerCase().includes("mild")) {
            solution.urgencyLevel = "Low"
          } else {
            solution.urgencyLevel = "Medium"
          }
          break
        case "nextSteps":
          solution.nextSteps.push(cleanLine)
          break
      }
    }

    console.log('Processed solution:', solution)
    return NextResponse.json(solution)
  } catch (error: any) {
    console.error('Error in Gemini API:', error)
    return NextResponse.json(
      { 
        error: "Failed to process medical analysis",
        details: error.message 
      },
      { status: 500 }
    )
  }
} 