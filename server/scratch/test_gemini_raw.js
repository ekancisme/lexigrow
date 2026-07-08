import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { GoogleGenerativeAI } from '@google/generative-ai'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env') })

const test = async () => {
  const apiKey = process.env.GEMINI_API_KEY
  console.log("Current GEMINI_API_KEY:", apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined')

  if (!apiKey) {
    console.error("❌ ERROR: GEMINI_API_KEY is not defined in server/.env")
    process.exit(1)
  }

  try {
    console.log("Initializing Gemini API client...")
    const genAI = new GoogleGenerativeAI(apiKey)
    
    // Attempting to list models to verify the key and see what's available
    // NOTE: listModels is a method on the GoogleGenerativeAI instance, or we can catch any auth error here.
    console.log("Attempting to list available models...")
    // Wait, let's try calling a model first, like gemini-2.5-flash or gemini-2.0-flash
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    })

    console.log("Sending a test prompt to gemini-2.5-flash expecting JSON...")
    const prompt = `You are a helpful assistant. Suggest exactly 3 interesting topics for the theme: "Space". Return a JSON object with a key "topics" containing a list of strings.`
    
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    console.log("Response text:\n", responseText)
    
    const parsed = JSON.parse(responseText)
    console.log("Successfully parsed JSON:\n", parsed)
    console.log("✅ TEST SUCCESSFUL!")
  } catch (err) {
    console.error("❌ Gemini API test failed:", err.message)
    if (err.stack) {
      console.error(err.stack)
    }
    
    console.log("\nAttempting to query with a standard model name (gemini-2.5-flash) failed, let's try with gemini-2.0-flash...")
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: { responseMimeType: 'application/json' }
      })
      const result = await model.generateContent(`Suggest exactly 3 interesting topics for Space. Return JSON {"topics": [...]}`)
      console.log("gemini-2.0-flash response text:\n", result.response.text())
      console.log("✅ SUCCESS with gemini-2.0-flash!")
    } catch (err2) {
      console.error("❌ gemini-2.0-flash also failed:", err2.message)
    }
    
    process.exit(1)
  }

  process.exit(0)
}

test().catch(err => {
  console.error("Test run failed:", err)
  process.exit(1)
})
