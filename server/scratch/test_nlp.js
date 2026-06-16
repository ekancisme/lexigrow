import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from '../src/config/db.js'
import { runNLPAnalysis } from '../src/services/ai.service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env') })

const test = async () => {
  console.log("Connecting to Database...")
  await connectDB()

  const sampleText = `The report was completed by the team who was very excited about the progress. 
This is because they worked extremely hard for two weeks. 
However, they used some very common words. They also used very, very, very simple language.`

  console.log("Running NLP Analysis...")
  const result = await runNLPAnalysis(sampleText)
  console.log("NLP Result:\n", JSON.stringify(result, null, 2))

  process.exit(0)
}

test().catch(err => {
  console.error("Test failed:", err)
  process.exit(1)
})
