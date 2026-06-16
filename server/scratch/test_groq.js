import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { generateTopicsByTheme, analyzeEssay } from '../src/services/ai.service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env') })

const test = async () => {
  const apiKey = process.env.GROQ_API_KEY
  console.log("Current GROQ_API_KEY:", apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined')

  if (!apiKey || apiKey.startsWith('gsk_dummy_prefix_000000000000')) {
    console.error("❌ ERROR: Please configure a valid GROQ_API_KEY in server/.env before running this test.")
    process.exit(1)
  }

  console.log("Testing Topic Generation for 'Technology' theme...")
  try {
    const topics = await generateTopicsByTheme('Technology')
    console.log("AI Suggested Topics:\n", JSON.stringify(topics, null, 2))
  } catch (err) {
    console.error("AI Suggested Topics failed:", err.message)
  }

  console.log("\nTesting Essay Analysis...")
  const essayContent = "Technology plays an extremely important role in education. Many students use computers to study."
  try {
    const analysis = await analyzeEssay(essayContent)
    console.log("AI Analysis Result:\n", JSON.stringify(analysis, null, 2))
  } catch (err) {
    console.error("AI Analysis failed:", err.message)
  }

  process.exit(0)
}

test().catch(err => {
  console.error("Test execution failed:", err)
  process.exit(1)
})
