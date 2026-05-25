import { useState } from 'react'
import './SystemPromptsManagement.css'

const prompts = [
  { id: 1, name: 'Essay Feedback - Standard', category: 'Feedback', lastUsed: 'Oct 24', status: 'active', template: 'Analyze the student essay for vocabulary diversity, grammar accuracy...' },
  { id: 2, name: 'Vocabulary Assessment', category: 'Analysis', lastUsed: 'Oct 22', status: 'active', template: 'Extract and categorize new vocabulary from the submitted text...' },
  { id: 3, name: 'Growth Report Generator', category: 'Reports', lastUsed: 'Oct 20', status: 'active', template: 'Generate a comprehensive growth report for the student...' },
  { id: 4, name: 'Writing Complexity Scorer', category: 'Scoring', lastUsed: 'Oct 18', status: 'draft', template: 'Evaluate the linguistic complexity of the text using...' },
]

export default function SystemPromptsManagement() {
  const [selectedPrompt, setSelectedPrompt] = useState(prompts[0])
  const [editText, setEditText] = useState(prompts[0].template)

  return (
    <div className="sys-prompts">
      <section className="sys-prompts__header">
        <div>
          <h2 className="text-headline-lg">System Prompts Management</h2>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>Configure AI prompts used for essay analysis and feedback generation</p>
        </div>
        <button className="sys-prompts__new-btn">
          <span className="material-symbols-outlined">add</span> New Prompt
        </button>
      </section>

      <div className="sys-prompts__layout">
        <div className="sys-prompts__list">
          {prompts.map(p => (
            <div key={p.id} className={`sys-prompts__item card-base ${selectedPrompt.id === p.id ? 'sys-prompts__item--active' : ''}`} onClick={() => { setSelectedPrompt(p); setEditText(p.template); }}>
              <div className="sys-prompts__item-top">
                <h4 className="text-label-md" style={{ fontWeight: 700 }}>{p.name}</h4>
                <span className={`sys-prompts__status sys-prompts__status--${p.status}`}>{p.status}</span>
              </div>
              <div className="sys-prompts__item-meta">
                <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>{p.category}</span>
                <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Last used: {p.lastUsed}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="sys-prompts__editor card-base">
          <h3 className="text-title-lg" style={{ marginBottom: 8 }}>{selectedPrompt.name}</h3>
          <p className="text-label-sm" style={{ color: 'var(--color-outline)', marginBottom: 20 }}>Category: {selectedPrompt.category}</p>
          <label className="text-label-md" style={{ color: 'var(--color-on-surface-variant)', display: 'block', marginBottom: 8 }}>Prompt Template</label>
          <textarea className="sys-prompts__textarea" rows={12} value={editText} onChange={e => setEditText(e.target.value)} />
          <div className="sys-prompts__editor-actions">
            <button className="sys-prompts__test-btn"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>play_arrow</span> Test Prompt</button>
            <button className="sys-prompts__save-btn"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span> Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  )
}
