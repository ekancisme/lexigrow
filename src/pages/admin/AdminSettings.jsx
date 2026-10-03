import { useState, useEffect } from 'react'
import api from '../../services/api'
import './AdminAISettings.css'

const AI_ROUTE_OPTIONS = [
  'essay_analysis', 'synonym_generation', 'synonym_recommendation', 'topic_generation',
  'vocabulary_enrichment', 'translation', 'ai_helper_spellcheck', 'ai_helper_improve',
  'learning_path', 'learning_set_recommendation', 'daily_quest', 'goal_recommendation',
  'vocabulary_analysis',
]

export default function AdminSettings({ section = 'all' }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  // Hugging Face remains a separate detector integration.
  const [showHf, setShowHf] = useState(false)

  // Hugging Face remains write-only and separate from the chat provider pool.
  const [hfToken, setHfToken] = useState('')
  const [hfConfigured, setHfConfigured] = useState(false)
  const [clearingHfToken, setClearingHfToken] = useState(false)
  const [defaultModel, setDefaultModel] = useState('llama-3.3-70b-versatile')
  const [defaultSelection, setDefaultSelection] = useState('model:llama-3.3-70b-versatile')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [allowPasteEssay, setAllowPasteEssay] = useState(true)
  const [providerAccounts, setProviderAccounts] = useState([])
  const [providerModels, setProviderModels] = useState([])
  const [modelCombos, setModelCombos] = useState([])
  const [comboDraft, setComboDraft] = useState({ name: '', routes: ['essay_analysis'], models: [], candidateToAdd: '', maxAttempts: 3, timeoutMs: 30000, maxCostUsd: '' })
  const [showComboModal, setShowComboModal] = useState(false)
  const [addingCombo, setAddingCombo] = useState(false)
  const [comboError, setComboError] = useState('')
  const [testingProviderId, setTestingProviderId] = useState(null)
  const [togglingProviderId, setTogglingProviderId] = useState(null)
  const [activeAiTab, setActiveAiTab] = useState('providers')
  const [showProviderModal, setShowProviderModal] = useState(false)
  const [providerDraft, setProviderDraft] = useState({ name: '', provider: 'openai-compatible', baseUrl: '', apiKey: '', priority: 100, inputCostPerMillionUsd: '', outputCostPerMillionUsd: '' })
  const [discoveredModels, setDiscoveredModels] = useState([])
  const [selectedProviderModels, setSelectedProviderModels] = useState([])
  const [modelSearch, setModelSearch] = useState('')
  const [discoveringModels, setDiscoveringModels] = useState(false)
  const [addingProvider, setAddingProvider] = useState(false)
  const [modelDiscoveryError, setModelDiscoveryError] = useState('')

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await api.get('/admin/config')
        const data = res.data || []
        let loadedCombos = []
        try {
          const [providerRes, modelRes, comboRes] = await Promise.all([
            api.get('/admin/ai/providers'),
            api.get('/admin/ai/providers/models'),
            api.get('/admin/ai/providers/combos'),
          ])
          setProviderAccounts(providerRes.data || [])
          setProviderModels(modelRes.data || [])
          loadedCombos = comboRes.data || []
          setModelCombos(loadedCombos)
            } catch (providerErr) {
          console.warn('Provider pool unavailable:', providerErr.message)
        }

        // Map inputs
        const hf = data.find(c => c.key === 'HF_API_TOKEN')
        const model = data.find(c => c.key === 'DEFAULT_AI_MODEL')
        const configuredComboId = data.find(c => c.key === 'DEFAULT_AI_COMBO')?.value || ''
        const prompt = data.find(c => c.key === 'SYSTEM_ANALYSIS_PROMPT')

        if (hf) {
          setHfToken('')
          setHfConfigured(Boolean(hf.isConfigured))
        }
        const configuredModel = model?.value || 'llama-3.3-70b-versatile'
        setDefaultModel(configuredModel)
        const selectedComboExists = loadedCombos.some((combo) => String(combo._id) === String(configuredComboId))
        setDefaultSelection(selectedComboExists ? `combo:${configuredComboId}` : `model:${configuredModel}`)
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

  const addProvider = async (e) => {
    e.preventDefault()
    if (!selectedProviderModels.length) {
      setModelDiscoveryError('Browse and select at least one model before saving.')
      return
    }
    setAddingProvider(true)
    setError(null)
    try {
      const res = await api.post('/admin/ai/providers', {
        ...providerDraft,
        model: selectedProviderModels[0].modelId,
        models: selectedProviderModels,
      })
      setProviderAccounts((current) => [...current, res.data])
      setProviderModels((current) => [...current, ...(res.data.models || []).map((model) => ({
        ...model,
        account: { _id: res.data._id, name: res.data.name, provider: res.data.provider },
      }))])
      closeProviderModal()
      setSuccessMsg('AI provider added successfully')
    } catch (err) {
      setError(err.message || 'Could not add AI provider')
    } finally {
      setAddingProvider(false)
    }
  }

  const discoverProviderModels = async () => {
    setDiscoveringModels(true)
    setModelDiscoveryError('')
    setDiscoveredModels([])
    setSelectedProviderModels([])
    try {
      const res = await api.post('/admin/ai/providers/models/discover', {
        provider: providerDraft.provider,
        baseUrl: providerDraft.baseUrl,
        apiKey: providerDraft.apiKey,
      })
      const models = res.data || []
      if (!models.length) throw new Error('The provider returned no available models.')
      setDiscoveredModels(models)
    } catch (err) {
      setModelDiscoveryError(err.message || 'Could not retrieve models from this provider.')
    } finally {
      setDiscoveringModels(false)
    }
  }

  const closeProviderModal = () => {
    setShowProviderModal(false)
    setProviderDraft({ name: '', provider: 'openai-compatible', baseUrl: '', apiKey: '', priority: 100, inputCostPerMillionUsd: '', outputCostPerMillionUsd: '' })
    setDiscoveredModels([])
    setSelectedProviderModels([])
    setModelSearch('')
    setModelDiscoveryError('')
  }

  const resetComboDraft = () => setComboDraft({ name: '', routes: ['essay_analysis'], models: [], candidateToAdd: '', maxAttempts: 3, timeoutMs: 30000, maxCostUsd: '' })

  const addCombo = async (event) => {
    event.preventDefault()
    if (!comboDraft.name.trim() || comboDraft.routes.length === 0 || comboDraft.models.length === 0) {
      setComboError('Enter a name, choose at least one route, and add at least one model candidate.')
      return
    }
    setAddingCombo(true)
    setComboError('')
    try {
      const res = await api.post('/admin/ai/providers/combos', {
        name: comboDraft.name.trim(),
        routes: comboDraft.routes,
        candidates: comboDraft.models.map((model) => ({ model })),
        maxAttempts: Number(comboDraft.maxAttempts),
        timeoutMs: Number(comboDraft.timeoutMs),
        maxCostUsd: comboDraft.maxCostUsd === '' ? null : Number(comboDraft.maxCostUsd),
        active: true,
      })
      setModelCombos((current) => [
        ...current.map((combo) => combo.routes?.some((route) => comboDraft.routes.includes(route)) ? { ...combo, active: false } : combo),
        res.data,
      ])
      setShowComboModal(false)
      resetComboDraft()
      setSuccessMsg('Model combo saved')
    } catch (err) {
      setComboError(err.message || 'Could not save model combo')
    } finally {
      setAddingCombo(false)
    }
  }

  const activateCombo = async (combo) => {
    try {
      const res = await api.post(`/admin/ai/providers/combos/${combo._id}/activate`)
      setModelCombos((current) => current.map((item) => item._id === combo._id
        ? res.data
        : item.routes?.some((route) => combo.routes?.includes(route)) ? { ...item, active: false } : item))
      setSuccessMsg(`${combo.name} activated for ${combo.routes.join(', ')}`)
    } catch (err) {
      setError(err.message || 'Could not activate model combo')
    }
  }

  const addComboCandidate = () => {
    if (!comboDraft.candidateToAdd || comboDraft.models.includes(comboDraft.candidateToAdd)) return
    setComboDraft((current) => ({ ...current, models: [...current.models, current.candidateToAdd], candidateToAdd: '' }))
  }

  const moveComboCandidate = (index, offset) => {
    setComboDraft((current) => {
      const nextIndex = index + offset
      if (nextIndex < 0 || nextIndex >= current.models.length) return current
      const models = [...current.models]
      ;[models[index], models[nextIndex]] = [models[nextIndex], models[index]]
      return { ...current, models }
    })
  }

  const closeComboModal = () => {
    if (addingCombo) return
    setShowComboModal(false)
    setComboError('')
    resetComboDraft()
  }

  const toggleProvider = async (account) => {
    setTogglingProviderId(account._id)
    setError(null)
    try {
      const res = await api.patch(`/admin/ai/providers/${account._id}`, { enabled: !account.enabled })
      setProviderAccounts((current) => current.map((item) => item._id === account._id ? res.data : item))
      setProviderModels((current) => current.map((model) => String(model.account?._id || model.account) === String(account._id)
        ? { ...model, account: { ...model.account, enabled: res.data.enabled } }
        : model))
      setSuccessMsg(`${account.name} ${res.data.enabled ? 'enabled' : 'disabled'}`)
    } catch (err) {
      setError(err.message || 'Could not update AI provider')
    } finally {
      setTogglingProviderId(null)
    }
  }

  const removeProvider = async (account) => {
    if (!window.confirm(`Remove ${account.name}?`)) return
    try {
      await api.delete(`/admin/ai/providers/${account._id}`)
      setProviderAccounts((current) => current.filter((item) => item._id !== account._id))
    } catch (err) {
      setError(err.message || 'Could not remove AI provider')
    }
  }

  const testProvider = async (account) => {
    setTestingProviderId(account._id)
    setError(null)
    try {
      const res = await api.post(`/admin/ai/providers/${account._id}/test`)
      setProviderAccounts((current) => current.map((item) => item._id === account._id ? { ...item, needsAttention: false, cooldownUntil: null, consecutiveFailures: 0, lastErrorCode: '' } : item))
      setSuccessMsg(`${account.name} is connected (${res.data?.latencyMs ?? 'ok'} ms)`)
    } catch (err) {
      setError(err.message || `${account.name} connection failed`)
      try {
        const providers = await api.get('/admin/ai/providers')
        setProviderAccounts(providers.data || [])
      } catch {
        // Keep the connection error visible even if refreshing account status fails.
      }
    } finally {
      setTestingProviderId(null)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccessMsg('')

    try {
      const payload = [
        { key: 'DEFAULT_AI_MODEL', value: defaultModel },
        { key: 'DEFAULT_AI_COMBO', value: defaultSelection.startsWith('combo:') ? defaultSelection.slice('combo:'.length) : '' },
        { key: 'SYSTEM_ANALYSIS_PROMPT', value: systemPrompt },
        { key: 'ALLOW_PASTE_ESSAY', value: allowPasteEssay.toString() }
      ]
      if (hfToken.trim()) payload.push({ key: 'HF_API_TOKEN', value: hfToken.trim() })

      await api.put('/admin/config', { settings: payload })
      if (hfToken.trim()) {
        setHfConfigured(true)
        setHfToken('')
      }
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

  const clearHfToken = async () => {
    setClearingHfToken(true)
    setError(null)
    try {
      await api.put('/admin/config', {
        settings: [{ key: 'HF_API_TOKEN', value: '', clearSecret: true }],
      })
      setHfConfigured(false)
      setHfToken('')
      setSuccessMsg('Hugging Face token removed')
    } catch (err) {
      setError(err.message || 'Could not remove Hugging Face token')
    } finally {
      setClearingHfToken(false)
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
    <div className="admin-card card-base admin-ai-settings">
      {section !== 'providers' && <div className="admin-card__header" style={{ marginBottom: 0, paddingBottom: '16px' }}>
        <h3 className="admin-card__title">System Configuration</h3>
        <p className="admin-card__desc">Manage API Keys, default AI model, and the AI System Prompt template used for grading student essays across the system.</p>
      </div>}

      {section !== 'settings' && <div className="admin-ai-settings__subtabs">
        {['providers', 'combos'].map((tab) => (
          <button key={tab} type="button" className={activeAiTab === tab ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveAiTab(tab)}>
            {tab === 'providers' ? 'Providers' : 'Model Combos'}
          </button>
        ))}
      </div>}
      {section !== 'settings' && <section className="admin-ai-settings__panel">
        {activeAiTab === 'providers' && section !== 'settings' && <>
        <div className="admin-ai-settings__section-heading">
          <h4>AI Provider Pool</h4>
          <p>Add multiple provider accounts. The server rotates priority accounts and fails over on quota/rate-limit errors.</p>
        </div>
        {providerAccounts.map((account) => (
          <div key={account._id} className="admin-ai-settings__account">
            <strong className="admin-ai-settings__account-name">{account.name}</strong>
            <span className="admin-ai-settings__account-model">{account.provider} · {account.model}</span>
            <span className={`admin-ai-settings__account-status ${account.needsAttention ? 'is-error' : account.enabled ? 'is-enabled' : ''}`}>
              {account.needsAttention ? 'Needs attention' : account.cooldownUntil && new Date(account.cooldownUntil) > new Date() ? 'Cooldown' : account.consecutiveFailures > 0 ? `Last check failed: ${account.lastErrorCode || 'provider error'}` : account.enabled ? 'Healthy / enabled' : 'Disabled'}
            </span>
            <span className="admin-ai-settings__account-pricing">
              {account.inputCostPerMillionUsd != null && account.outputCostPerMillionUsd != null
                ? `Input $${account.inputCostPerMillionUsd} / Output $${account.outputCostPerMillionUsd} per 1M tokens`
                : 'Pricing: registry or unknown'}
            </span>
            <span className="admin-ai-settings__account-key">{account.maskedKey}</span>
            <div className="admin-ai-settings__account-actions">
              <button type="button" className="btn-secondary" disabled={testingProviderId === account._id} onClick={() => testProvider(account)}>{testingProviderId === account._id ? 'Testing…' : 'Test'}</button>
              <button type="button" className="btn-secondary" disabled={togglingProviderId === account._id} onClick={() => toggleProvider(account)}>{togglingProviderId === account._id ? 'Updating…' : account.enabled ? 'Disable' : 'Enable'}</button>
              <button type="button" className="btn-secondary" onClick={() => removeProvider(account)}>Remove</button>
            </div>
          </div>
        ))}
        <button type="button" className="btn-primary admin-ai-settings__add-button" onClick={() => setShowProviderModal(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 6 }}>add</span>
          Add provider
        </button>
        {showProviderModal && (
          <div
            role="presentation"
            onMouseDown={(event) => { if (event.target === event.currentTarget && !addingProvider) closeProviderModal() }}
            className="admin-ai-settings__backdrop"
          >
            <form
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-provider-title"
              onSubmit={addProvider}
              className="admin-ai-settings__modal"
            >
              <div className="admin-ai-settings__modal-header">
                <div>
              <h3 id="add-provider-title">Connect AI provider</h3>
                  <p>Enter the connection details, then browse the models this provider supports.</p>
                </div>
                <button type="button" className="btn-secondary" aria-label="Close" disabled={addingProvider} onClick={closeProviderModal}>×</button>
              </div>

              <div className="admin-ai-settings__form-grid">
                <label className="admin-ai-settings__field">
                  Account name
                  <input required maxLength={100} value={providerDraft.name} onChange={(e) => setProviderDraft({ ...providerDraft, name: e.target.value })} placeholder="e.g. Xkiro primary" />
                </label>
                <label className="admin-ai-settings__field">
                  Provider type
                  <select value={providerDraft.provider} onChange={(e) => { setProviderDraft({ ...providerDraft, provider: e.target.value }); setDiscoveredModels([]); setSelectedProviderModels([]); setModelDiscoveryError('') }}>
                    <option value="openai-compatible">OpenAI-compatible</option>
                    <option value="groq">Groq</option>
                    <option value="gemini">Google Gemini</option>
                  </select>
                </label>
                <label className="admin-ai-settings__field">
                  Base URL {providerDraft.provider === 'openai-compatible' ? '(required)' : '(optional)'}
                  <input required={providerDraft.provider === 'openai-compatible'} type="url" value={providerDraft.baseUrl} onChange={(e) => { setProviderDraft({ ...providerDraft, baseUrl: e.target.value }); setDiscoveredModels([]); setSelectedProviderModels([]) }} placeholder={providerDraft.provider === 'gemini' ? 'https://generativelanguage.googleapis.com/v1beta' : 'https://api.example.com/v1'} />
                </label>
                <label className="admin-ai-settings__field">
                  API key (write-only)
                  <input required type="password" autoComplete="new-password" value={providerDraft.apiKey} onChange={(e) => { setProviderDraft({ ...providerDraft, apiKey: e.target.value }); setDiscoveredModels([]); setSelectedProviderModels([]) }} placeholder="Paste provider API key" />
                </label>
                <label className="admin-ai-settings__field">
                  Input USD / 1M tokens (optional)
                  <input type="number" min="0" step="any" value={providerDraft.inputCostPerMillionUsd} onChange={(e) => setProviderDraft({ ...providerDraft, inputCostPerMillionUsd: e.target.value })} placeholder="Leave blank if unknown" />
                </label>
                <label className="admin-ai-settings__field">
                  Output USD / 1M tokens (optional)
                  <input type="number" min="0" step="any" value={providerDraft.outputCostPerMillionUsd} onChange={(e) => setProviderDraft({ ...providerDraft, outputCostPerMillionUsd: e.target.value })} placeholder="Leave blank if unknown" />
                </label>
              </div>
              <p className="admin-ai-settings__hint">The entered rates apply to each model selected below. Leave both empty when pricing is unknown.</p>

              <div className="admin-ai-settings__inline-actions">
                <button type="button" className="btn-secondary" disabled={discoveringModels || !providerDraft.apiKey || (providerDraft.provider === 'openai-compatible' && !providerDraft.baseUrl)} onClick={discoverProviderModels}>
                  {discoveringModels ? 'Browsing models…' : 'Browse models'}
                </button>
                {discoveredModels.length > 0 && <span className="admin-ai-settings__muted">{discoveredModels.length} models available</span>}
              </div>

              {modelDiscoveryError && <p role="alert" className="admin-ai-settings__form-error">{modelDiscoveryError}</p>}

              {discoveredModels.length > 0 && (
                <div className="admin-ai-settings__model-picker">
                  <div className="admin-ai-settings__picker-header">
                    <strong>Select supported models</strong>
                    <span className="admin-ai-settings__muted">{selectedProviderModels.length} selected</span>
                  </div>
                  <input aria-label="Search supported models" value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} placeholder="Filter models…" />
                  <div className="admin-ai-settings__model-list">
                    {discoveredModels.filter((model) => `${model.displayName} ${model.modelId}`.toLowerCase().includes(modelSearch.trim().toLowerCase())).map((model) => {
                      const selected = selectedProviderModels.some((item) => item.modelId === model.modelId)
                      return (
                        <label key={model.modelId} className="admin-ai-settings__model-row">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(event) => setSelectedProviderModels((current) => event.target.checked
                              ? [...current, model]
                              : current.filter((item) => item.modelId !== model.modelId))}
                          />
                          <span className="admin-ai-settings__model-copy">
                            <strong>{model.displayName}</strong>
                            <span>{model.modelId}</span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="admin-ai-settings__modal-actions">
                <button type="button" className="btn-secondary" disabled={addingProvider} onClick={closeProviderModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={addingProvider || !selectedProviderModels.length}>
                  {addingProvider ? 'Saving…' : `Connect${selectedProviderModels.length ? ` ${selectedProviderModels.length} model${selectedProviderModels.length > 1 ? 's' : ''}` : ' provider'}`}
                </button>
              </div>
            </form>
          </div>
        )}
        </>}
        {activeAiTab === 'combos' && section !== 'settings' && <div>
          <div className="admin-ai-settings__combo-heading">
            <div>
              <h4>Model Combos</h4>
              <p>Each combo has an ordered model chain. The next model is tried after a temporary failure or quota error.</p>
            </div>
            <button type="button" className="btn-primary" onClick={() => { resetComboDraft(); setComboError(''); setShowComboModal(true) }}>Add combo</button>
          </div>

          {modelCombos.length === 0 ? (
            <p className="admin-ai-settings__empty">No model combos yet. Add a combo to define provider order for selected routes.</p>
          ) : modelCombos.map((combo) => {
            const orderedCandidates = [...(combo.candidates || [])].sort((a, b) => a.order - b.order)
            const candidateNames = orderedCandidates.map((candidate) => {
              const id = String(candidate.model?._id || candidate.model)
              const model = providerModels.find((item) => String(item._id) === id)
              return model?.displayName || model?.modelId || id
            })
            return (
              <div key={combo._id} className="admin-ai-settings__combo-card">
                <div className="admin-ai-settings__combo-title-row">
                  <strong>{combo.name}</strong>
                <span className={`admin-ai-settings__combo-status ${combo.active ? 'is-active' : ''}`}>{combo.active ? 'Active' : 'Inactive'}</span>
                </div>
                <span className="admin-ai-settings__combo-routes">Routes: {(combo.routes || []).join(', ') || 'none'}</span>
                <span className="admin-ai-settings__combo-models">{candidateNames.join('  →  ')}</span>
                <span className="admin-ai-settings__combo-meta">Max attempts: {combo.maxAttempts} · Timeout: {combo.timeoutMs} ms{combo.maxCostUsd != null ? ` · Max cost: $${combo.maxCostUsd}` : ''}</span>
                {!combo.active && <button type="button" className="btn-secondary admin-ai-settings__activate-button" onClick={() => activateCombo(combo)}>Activate for these routes</button>}
              </div>
            )
          })}

          {showComboModal && (
            <div
              role="presentation"
              onMouseDown={(event) => { if (event.target === event.currentTarget && !addingCombo) closeComboModal() }}
              className="admin-ai-settings__backdrop"
            >
              <form
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-combo-title"
                onSubmit={addCombo}
                className="admin-ai-settings__modal admin-ai-settings__modal--combo"
              >
                <div className="admin-ai-settings__modal-heading">
                  <h3 id="add-combo-title">Create model combo</h3>
                  <p>Choose the routes, then add models in the exact order they should be tried.</p>
                </div>
                {comboError && <p role="alert" className="admin-ai-settings__form-error">{comboError}</p>}
                <label className="admin-ai-settings__field">
                  Combo name
                  <input required maxLength={120} value={comboDraft.name} onChange={(e) => setComboDraft({ ...comboDraft, name: e.target.value })} placeholder="e.g. Writing fallback chain" />
                </label>

                <fieldset className="admin-ai-settings__routes">
                  <legend>Routes</legend>
                  <div className="admin-ai-settings__route-list">
                    {AI_ROUTE_OPTIONS.map((route) => (
                    <label key={route} className="admin-ai-settings__route-option">
                        <input type="checkbox" checked={comboDraft.routes.includes(route)} onChange={(event) => setComboDraft((current) => ({ ...current, routes: event.target.checked ? [...current.routes, route] : current.routes.filter((item) => item !== route) }))} />
                        {route}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="admin-ai-settings__candidate-picker">
                  <select aria-label="Choose model candidate" value={comboDraft.candidateToAdd} onChange={(e) => setComboDraft({ ...comboDraft, candidateToAdd: e.target.value })}>
                    <option value="">Choose an enabled provider model</option>
                    {providerModels.filter((model) => model.enabled && model.account?.enabled !== false && !comboDraft.models.includes(model._id)).map((model) => (
                      <option key={model._id} value={model._id}>{model.displayName || model.modelId} · {model.account?.name || model.account?.provider || 'provider'}</option>
                    ))}
                  </select>
                  <button type="button" className="btn-secondary" disabled={!comboDraft.candidateToAdd} onClick={addComboCandidate}>Add model</button>
                </div>

                <div className="admin-ai-settings__candidate-list">
                  <strong>Fallback order</strong>
                  {comboDraft.models.length === 0 ? (
                    <p className="admin-ai-settings__muted">No models added yet.</p>
                  ) : comboDraft.models.map((modelId, index) => {
                    const model = providerModels.find((item) => item._id === modelId)
                    return (
                      <div key={modelId} className="admin-ai-settings__candidate-row">
                        <strong className="admin-ai-settings__candidate-index">{index + 1}.</strong>
                        <span className="admin-ai-settings__candidate-name">{model?.displayName || model?.modelId || modelId} · {model?.account?.name || model?.account?.provider || 'provider'}</span>
                        <button type="button" className="btn-secondary" aria-label={`Move ${model?.modelId || 'model'} up`} disabled={index === 0} onClick={() => moveComboCandidate(index, -1)}>↑</button>
                        <button type="button" className="btn-secondary" aria-label={`Move ${model?.modelId || 'model'} down`} disabled={index === comboDraft.models.length - 1} onClick={() => moveComboCandidate(index, 1)}>↓</button>
                        <button type="button" className="btn-secondary" aria-label={`Remove ${model?.modelId || 'model'}`} onClick={() => setComboDraft((current) => ({ ...current, models: current.models.filter((id) => id !== modelId) }))}>Remove</button>
                      </div>
                    )
                  })}
                </div>

                <div className="admin-ai-settings__form-grid admin-ai-settings__form-grid--limits">
                  <label className="admin-ai-settings__field">Max attempts<input type="number" min="1" max="10" value={comboDraft.maxAttempts} onChange={(e) => setComboDraft({ ...comboDraft, maxAttempts: e.target.value })} /></label>
                  <label className="admin-ai-settings__field">Timeout (ms)<input type="number" min="1000" max="120000" step="1000" value={comboDraft.timeoutMs} onChange={(e) => setComboDraft({ ...comboDraft, timeoutMs: e.target.value })} /></label>
                  <label className="admin-ai-settings__field">Max cost (USD)<input type="number" min="0" step="any" value={comboDraft.maxCostUsd} onChange={(e) => setComboDraft({ ...comboDraft, maxCostUsd: e.target.value })} placeholder="Optional" /></label>
                </div>

                <div className="admin-ai-settings__modal-actions">
                  <button type="button" className="btn-secondary" disabled={addingCombo} onClick={closeComboModal}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={addingCombo || !comboDraft.models.length || !comboDraft.routes.length}>{addingCombo ? 'Saving…' : 'Save and activate combo'}</button>
                </div>
              </form>
            </div>
          )}
        </div>}
      </section>}

      {section === 'providers' && (error || successMsg) && (
        <div role={error ? 'alert' : 'status'} className={`admin-ai-settings__notice ${error ? 'is-error' : 'is-success'}`}>
          {error || successMsg}
        </div>
      )}

      {section !== 'providers' && <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Detector credentials remain separate from chat LLM provider accounts. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-on-surface)', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '6px' }}>Detector Configuration</h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Hugging Face Token */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface)' }}>Hugging Face API Token (Optional)</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showHf ? 'text' : 'password'}
                  value={hfToken}
                  onChange={(e) => setHfToken(e.target.value)}
                  placeholder="Leave blank to keep the configured token; enter a new token to replace it"
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-outline)' }}>
                  {hfConfigured ? 'Token configured (hidden)' : 'No token configured'}
                </span>
                {hfConfigured && (
                  <button
                    type="button"
                    onClick={clearHfToken}
                    disabled={clearingHfToken}
                    style={{ border: 0, background: 'none', color: 'var(--color-error)', cursor: clearingHfToken ? 'wait' : 'pointer' }}
                  >
                    {clearingHfToken ? 'Removing…' : 'Remove token'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Default AI Model */}
        <div className="admin-ai-settings__default-model">
          <label>Default AI Model</label>
          <p>Select the primary LLM model to handle essay analysis and scoring.</p>
          <p>Choose a model or a configured combo. A combo runs for the routes assigned to it.</p>
          <select
            value={defaultSelection}
            onChange={(e) => {
              const value = e.target.value
              setDefaultSelection(value)
              if (value.startsWith('model:')) setDefaultModel(value.slice('model:'.length))
            }}
            className="admin-ai-settings__default-select"
          >
            <optgroup label="Models">
              <option value="model:llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recommended - Fast & Accurate)</option>
              <option value="model:llama-3.1-8b-instant">llama-3.1-8b-instant (Extremely Fast - Low Cost)</option>
              <option value="model:mixtral-8x7b-32768">mixtral-8x7b-32768 (Long Context Handling)</option>
              <option value="model:gemma2-9b-it">gemma2-9b-it (Google Gemma 2)</option>
              {!['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'].includes(defaultModel) && <option value={`model:${defaultModel}`}>{defaultModel}</option>}
            </optgroup>
            {modelCombos.length > 0 && (
              <optgroup label="Model Combos">
                {modelCombos.map((combo) => (
                  <option key={combo._id} value={`combo:${combo._id}`}>
                    {(combo.name || 'Unnamed combo').slice(0, 48)}{combo.name?.length > 48 ? '…' : ''} · {(combo.routes || []).length} routes{combo.active ? ' · active' : ''}
                  </option>
                ))}
              </optgroup>
            )}
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

      </form>}
    </div>
  )
}
