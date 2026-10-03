const test = async () => {
  const apiKey = process.env.AIML_API_KEY
  if (!apiKey) {
    console.error('Set AIML_API_KEY before running this scratch test.')
    process.exit(1)
  }

  const modelName = process.env.AIML_MODEL || 'google/gemini-2.5-flash'
  console.log(`Sending a test request using ${modelName}...`)

  try {
    const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: 'Suggest exactly 3 interesting topics for Space as JSON.' }],
        response_format: { type: 'json_object' },
      }),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`)
    console.log(JSON.stringify(await response.json(), null, 2))
  } catch (err) {
    console.error('AIML API test failed:', err.message)
    process.exit(1)
  }
}

test()
