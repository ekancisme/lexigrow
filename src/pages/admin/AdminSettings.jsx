import { useState, useEffect } from 'react'
import api from '../../services/api'

export default function AdminSettings() {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  // State for show/hide API keys
  const [showGroq, setShowGroq] = useState(false)
  const [showOpenAI, setShowOpenAI] = useState(false)
  const [showLlama, setShowLlama] = useState(false)
  const [showHf, setShowHf] = useState(false)

  // Local state variables for form inputs
  const [groqKey, setGroqKey] = useState('')
  const [openAIKey, setOpenAIKey] = useState('')
  const [llamaKey, setLlamaKey] = useState('')
  const [hfToken, setHfToken] = useState('')
  const [defaultModel, setDefaultModel] = useState('llama-3.3-70b-versatile')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [allowPasteEssay, setAllowPasteEssay] = useState(true)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await api.get('/admin/config')
        const data = res.data || []
        setSettings(data)

        // Map inputs
        const groq = data.find(c => c.key === 'GROQ_API_KEY')
        const openai = data.find(c => c.key === 'OPENAI_API_KEY')
        const llama = data.find(c => c.key === 'LLAMA_API_KEY')
        const hf = data.find(c => c.key === 'HF_API_TOKEN')
        const model = data.find(c => c.key === 'DEFAULT_AI_MODEL')
        const prompt = data.find(c => c.key === 'SYSTEM_ANALYSIS_PROMPT')

        if (groq) setGroqKey(groq.value || '')
        if (openai) setOpenAIKey(openai.value || '')
        if (llama) setLlamaKey(llama.value || '')
        if (hf) setHfToken(hf.value || '')
        if (model) setDefaultModel(model.value || 'llama-3.3-70b-versatile')
        if (prompt) setSystemPrompt(prompt.value || '')
        const paste = data.find(c => c.key === 'ALLOW_PASTE_ESSAY')
        if (paste) setAllowPasteEssay(paste.value === 'true' || paste.value === true)
      } catch (err) {
        console.error('Error fetching system settings:', err)
        setError(err.message || 'Could not load system configuration')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccessMsg('')

    try {
      const payload = [
        { key: 'GROQ_API_KEY', value: groqKey },
        { key: 'OPENAI_API_KEY', value: openAIKey },
        { key: 'LLAMA_API_KEY', value: llamaKey },
        { key: 'HF_API_TOKEN', value: hfToken },
        { key: 'DEFAULT_AI_MODEL', value: defaultModel },
        { key: 'SYSTEM_ANALYSIS_PROMPT', value: systemPrompt },
        { key: 'ALLOW_PASTE_ESSAY', value: allowPasteEssay.toString() }
      ]

      await api.put('/admin/config', { settings: payload })
      setSuccessMsg('System configuration saved successfully!')
      
      // Auto clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMsg('')
      }, 3000)
    } catch (err) {
      console.error('Error saving settings:', err)
      setError(err.message || 'Could not update system configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleRestoreDefaultPrompt = () => {
    const defaultPrompt = `You are an advanced English writing analysis AI for the LexiGrow platform.
Analyze the student's essay and return a JSON response with EXACTLY this structure:

{
  "overallScore": <number 0-10>,
  "scores": {
    "vocabularyDiversity": <number 0-1, this is the Type-Token Ratio>,
    "grammarAccuracy": <number 0-10>,
    "coherence": <number 0-10>,
    "complexityIndex": <number 0-10>
  },
  "newWordsDetected": [<list of advanced/uncommon English words used>],
  "suggestions": [
    {"type": "strength", "text": "<what the student did well>"},
    {"type": "improvement", "text": "<what could be improved>"}
  ],
  "writingStats": {
    "avgSentenceLength": <number>,
    "uniqueWords": <number>
  },
  "learningPatterns": {
    "paddedSentences": <true | false>,
    "plagiarismDetected": <true | false>,
    "learningStatus": "progressing" | "plateau" | "regression" | "stable",
    "feedback": "<detailed English feedback explaining word padding, copy-paste flags, and learning status trajectory compared to past history>"
  },
  "nextEssaySuggestions": {
    "transitionWords": [<array of 3-5 advanced transition words/phrases recommended to connect ideas in their next essay, e.g. "On the other hand", "Furthermore", "Consequently">],
    "sentenceStructures": [<array of 2-3 sentence structures/patterns they should try next, e.g. "Relative clauses", "Conditional sentences (Type 3)", "Inversion">],
    "generalTips": "<detailed English tips/advice on how they can improve cohesive flow and grammatical variety in their next essay>"
  }
}

Rules:
- vocabularyDiversity (TTR) = unique words / total words, rounded to 2 decimal places
- newWordsDetected should include academic, technical, or B2+ level words
- Provide at least 2 strengths and 2 improvements in suggestions
- For learningPatterns:
  * paddedSentences: set to true if the student repeats synonyms or writes long, repetitive, meaningless sentences to inflate word count.
  * plagiarismDetected: set to true if there is a high likelihood of plagiarism or copy-pasting (unnatural flow transitions, vocabulary far exceeding typical student level, or rigid structures).
  * learningStatus: Compare current essay performance with the student's past performance history (if provided in the user request). Choose "progressing" if scores/vocabulary have improved, "plateau" if there is no significant change over time, "regression" if there is a decrease, or "stable" if they remain consistent at a high level.
  * feedback: Write a detailed summary in English explaining the findings for these patterns.
- Return ONLY valid JSON, no markdown formatting`

    setSystemPrompt(defaultPrompt)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '12px' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
        <p style={{ color: 'var(--color-outline)', fontSize: '14px' }}>Loading configuration details...</p>
      </div>
    )
  }

  return (
    <div className="admin-card card-base" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="admin-card__header" style={{ marginBottom: 0, paddingBottom: '16px' }}>
        <h3 className="admin-card__title">System Configuration</h3>
        <p className="admin-card__desc">Manage API Keys, default AI model, and the AI System Prompt template used for grading student essays across the system.</p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Row 1: API Keys */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-on-surface)', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '6px' }}>API Keys</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Groq Key */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface)' }}>Groq API Key</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showGroq ? 'text' : 'password'}
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="Enter Groq API Key..."
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-outline-variant)',
                    background: 'var(--color-surface-container-lowest)',
                    color: 'var(--color-on-surface)',
                    fontSize: '14px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowGroq(!showGroq)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-outline)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {showGroq ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* OpenAI Key */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface)' }}>OpenAI API Key (Optional)</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showOpenAI ? 'text' : 'password'}
                  value={openAIKey}
                  onChange={(e) => setOpenAIKey(e.target.value)}
                  placeholder="Enter OpenAI API Key..."
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-outline-variant)',
                    background: 'var(--color-surface-container-lowest)',
                    color: 'var(--color-on-surface)',
                    fontSize: '14px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowOpenAI(!showOpenAI)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-outline)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {showOpenAI ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Llama Key */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface)' }}>Llama API Key (Optional)</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showLlama ? 'text' : 'password'}
                  value={llamaKey}
                  onChange={(e) => setLlamaKey(e.target.value)}
                  placeholder="Enter Llama API Key..."
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-outline-variant)',
                    background: 'var(--color-surface-container-lowest)',
                    color: 'var(--color-on-surface)',
                    fontSize: '14px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowLlama(!showLlama)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-outline)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {showLlama ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Hugging Face Token */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface)' }}>Hugging Face API Token (Optional)</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showHf ? 'text' : 'password'}
                  value={hfToken}
                  onChange={(e) => setHfToken(e.target.value)}
                  placeholder="Enter Hugging Face API Token..."
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-outline-variant)',
                    background: 'var(--color-surface-container-lowest)',
                    color: 'var(--color-on-surface)',
                    fontSize: '14px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowHf(!showHf)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-outline)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {showHf ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Default AI Model */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-on-surface)' }}>Default AI Model</label>
          <p style={{ fontSize: '12px', color: 'var(--color-outline)', marginTop: '-4px' }}>Select the primary LLM model to handle essay analysis and scoring.</p>
          <select
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-outline-variant)',
              background: 'var(--color-surface-container-lowest)',
              color: 'var(--color-on-surface)',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recommended - Fast & Accurate)</option>
            <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Extremely Fast - Low Cost)</option>
            <option value="mixtral-8x7b-32768">mixtral-8x7b-32768 (Long Context Handling)</option>
            <option value="gemma2-9b-it">gemma2-9b-it (Google Gemma 2)</option>
          </select>
        </div>

        {/* Row 2.5: Student Paste Essay Policy Switch */}
        <div className="switch-container" style={{ maxWidth: '400px' }}>
          <div className="switch-label-group">
            <span className="switch-title">Allow students to paste essays</span>
            <span className="switch-description">
              Enable to allow students to copy-paste essays. Disable to block paste events and force manual typing.
            </span>
          </div>
          <label className="switch-toggle">
            <input
              type="checkbox"
              checked={allowPasteEssay}
              onChange={(e) => setAllowPasteEssay(e.target.checked)}
            />
            <span className="switch-slider"></span>
          </label>
        </div>

        {/* Row 3: System Prompt Template */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-on-surface)' }}>AI System Prompt Template</label>
            <button
              type="button"
              onClick={handleRestoreDefaultPrompt}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>restore</span>
              Restore default template
            </button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-outline)', marginTop: '-4px' }}>
            Adjust the system instruction prompt. This prompt dictates IELTS grading criteria, JSON analysis structure, and plagiarism/word padding detection methods.
          </p>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={12}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-outline-variant)',
              background: 'var(--color-surface-container-lowest)',
              color: 'var(--color-on-surface)',
              fontSize: '13px',
              fontFamily: 'monospace',
              lineHeight: 1.5,
              resize: 'vertical'
            }}
          />
        </div>

        {/* Alert/Status messages */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'rgba(211, 47, 47, 0.1)', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-md)', color: 'var(--color-error)', fontSize: '14px' }}>
            <span className="material-symbols-outlined">error</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'rgba(40, 167, 69, 0.1)', border: '1px solid #28a745', borderRadius: 'var(--radius-md)', color: '#28a745', fontSize: '14px', fontWeight: 600 }}>
            <span className="material-symbols-outlined">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '12px 24px',
            background: 'var(--color-primary)',
            color: 'var(--color-on-primary)',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            fontSize: '14px',
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s'
          }}
        >
          {saving ? (
            <>
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>autorenew</span>
              Saving configuration...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
              Save Configuration
            </>
          )}
        </button>

      </form>
    </div>
  )
}
