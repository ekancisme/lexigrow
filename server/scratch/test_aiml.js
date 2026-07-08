const test = async () => {
  // Use the API key provided by the user
  const apiKey = 'ba9433bf870aa2d9506d629b1cb8b353'
  console.log("Testing AIML API with key:", `${apiKey.substring(0, 8)}...`)

  const modelName = 'google/gemini-2.5-flash'
  console.log(`Sending test request using model: ${modelName}...`)

  try {
    const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'user', content: 'Suggest exactly 3 interesting topics for the theme: "Space". Return a JSON object with a key "topics" containing a list of strings.' }
        ],
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`HTTP ${response.status} ${response.statusText}: ${errText}`)
    }

    const data = await response.json()
    console.log("API Response Data:\n", JSON.stringify(data, null, 2))

    const contentText = data.choices[0].message.content
    console.log("Message Content Text:\n", contentText)

    const parsed = JSON.parse(contentText.trim())
    console.log("Successfully parsed JSON:\n", parsed)
    console.log("✅ AIML API TEST SUCCESSFUL!")
  } catch (err) {
    console.error("❌ AIML API test failed:", err.message)
    process.exit(1)
  }

  process.exit(0)
}

test().catch(err => {
  console.error("Test run failed:", err)
  process.exit(1)
})
