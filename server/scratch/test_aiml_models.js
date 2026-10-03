const apiKey = process.env.AIML_API_KEY

if (!apiKey) {
  console.error('Set AIML_API_KEY before running this scratch test.')
  process.exit(1)
}

const testModels = async () => {
  try {
    const response = await fetch('https://api.aimlapi.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`)
    const data = await response.json()
    const geminiModels = data.data.filter((model) => model.id.toLowerCase().includes('gemini'))
    console.log('Available Gemini Models:')
    geminiModels.forEach((model) => console.log(`- ${model.id} (Aliases: ${JSON.stringify(model.aliases || [])})`))
  } catch (err) {
    console.error('Error fetching models:', err.message)
    process.exit(1)
  }
}

testModels()
