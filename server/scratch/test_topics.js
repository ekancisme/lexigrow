import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { generateTopicsByTheme } from '../src/services/ai.service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env') })

const test = async () => {
  console.log("Generating topics for theme 'Technology' using AI...")
  const topicsTech = await generateTopicsByTheme('Technology')
  console.log("Technology topics:\n", JSON.stringify(topicsTech, null, 2))

  console.log("Generating topics for theme 'Environment' using AI...")
  const topicsEnv = await generateTopicsByTheme('Environment')
  console.log("Environment topics:\n", JSON.stringify(topicsEnv, null, 2))

  process.exit(0)
}

test().catch(err => {
  console.error("Test failed:", err)
  process.exit(1)
})
