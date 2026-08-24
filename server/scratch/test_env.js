import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

const token = process.env.HF_API_TOKEN
console.log('HF_API_TOKEN:', token ? `${token.substring(0, 6)}...` : 'undefined')

async function testFetch() {
  try {
    console.log('Attempting fetch to modern Hugging Face router...')
    const response = await fetch(
      'https://router.huggingface.co/hf-inference/models/Hello-SimpleAI/chatgpt-detector-roberta',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-wait-for-model': 'true'
        },
        body: JSON.stringify({ inputs: 'This is a test sentence to check AI detection. Artificial intelligence is evolving rapidly.' })
      }
    )
    console.log('Response status:', response.status)
    const result = await response.json()
    console.log('Response body:', JSON.stringify(result))
  } catch (err) {
    console.error('Fetch failed with error:')
    console.error(err)
  }
}

testFetch()
