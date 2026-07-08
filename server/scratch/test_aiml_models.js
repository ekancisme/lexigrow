const apiKey = 'ba9433bf870aa2d9506d629b1cb8b353'

const testModels = async () => {
  try {
    const response = await fetch('https://api.aimlapi.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })

    const data = await response.json()
    const geminiModels = data.data.filter(m => m.id.toLowerCase().includes('gemini'))
    console.log("Available Gemini Models:")
    geminiModels.forEach(m => {
      console.log(`- ID: ${m.id} (Aliases: ${JSON.stringify(m.aliases || [])})`)
    })
  } catch (err) {
    console.error("Error fetching models:", err.message)
  }
}

testModels()
