import { useState } from 'react'
import './WriteEssay.css'

const topicSuggestions = [
  'The Impact of Social Media on Education',
  'Climate Change and Urban Planning',
  'Artificial Intelligence in Healthcare',
  'The Future of Remote Work',
]

export default function WriteEssay() {
  const [essayText, setEssayText] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [title, setTitle] = useState('')

  const wordCount = essayText.trim() ? essayText.trim().split(/\s+/).length : 0

  return (
    <div className="write-essay">
      {/* Header */}
      <section className="write-essay__header">
        <div>
          <h2 className="text-headline-lg">Write Essay</h2>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
            Compose your essay and let AI analyze your vocabulary growth
          </p>
        </div>
        <div className="write-essay__actions">
          <button className="write-essay__btn-secondary">
            <span className="material-symbols-outlined">save</span>
            Save Draft
          </button>
          <button className="write-essay__btn-primary">
            <span className="material-symbols-outlined">send</span>
            Submit Essay
          </button>
        </div>
      </section>

      <div className="write-essay__layout">
        {/* Editor Area */}
        <div className="write-essay__editor-area">
          {/* Title */}
          <div className="write-essay__title-field card-base">
            <label className="text-label-md" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 8, display: 'block' }}>Essay Title</label>
            <input
              type="text"
              className="write-essay__title-input"
              placeholder="Enter your essay title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Editor */}
          <div className="write-essay__editor card-base">
            {/* Toolbar */}
            <div className="write-essay__toolbar">
              <div className="write-essay__toolbar-group">
                <button className="write-essay__tool-btn"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>format_bold</span></button>
                <button className="write-essay__tool-btn"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>format_italic</span></button>
                <button className="write-essay__tool-btn"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>format_underlined</span></button>
              </div>
              <div className="write-essay__toolbar-divider" />
              <div className="write-essay__toolbar-group">
                <button className="write-essay__tool-btn"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>format_list_bulleted</span></button>
                <button className="write-essay__tool-btn"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>format_list_numbered</span></button>
                <button className="write-essay__tool-btn"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>format_quote</span></button>
              </div>
              <div className="write-essay__toolbar-divider" />
              <div className="write-essay__toolbar-group">
                <button className="write-essay__tool-btn"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>spellcheck</span></button>
                <button className="write-essay__tool-btn"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>auto_fix_high</span></button>
              </div>
            </div>

            {/* Text Area */}
            <textarea
              className="write-essay__textarea"
              placeholder="Start writing your essay here..."
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              rows={16}
            />

            {/* Footer */}
            <div className="write-essay__editor-footer">
              <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>
                {wordCount} words
              </span>
              <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>
                Auto-saved at {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="write-essay__side">
          {/* Topic Suggestions */}
          <div className="card-base">
            <h3 className="text-title-lg" style={{ marginBottom: 16 }}>Topic Suggestions</h3>
            <div className="write-essay__topics">
              {topicSuggestions.map((topic, i) => (
                <button
                  key={i}
                  className={`write-essay__topic ${selectedTopic === topic ? 'write-essay__topic--active' : ''}`}
                  onClick={() => {
                    setSelectedTopic(topic)
                    setTitle(topic)
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>lightbulb</span>
                  <span>{topic}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Writing Stats */}
          <div className="card-base">
            <h3 className="text-title-lg" style={{ marginBottom: 16 }}>Writing Stats</h3>
            <div className="write-essay__stats">
              <div className="write-essay__stat-item">
                <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Paragraphs</span>
                <span className="text-data-mono">{essayText.split('\n\n').filter(Boolean).length || 0}</span>
              </div>
              <div className="write-essay__stat-item">
                <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Sentences</span>
                <span className="text-data-mono">{essayText.split(/[.!?]+/).filter(Boolean).length || 0}</span>
              </div>
              <div className="write-essay__stat-item">
                <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Characters</span>
                <span className="text-data-mono">{essayText.length}</span>
              </div>
              <div className="write-essay__stat-item">
                <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Reading Time</span>
                <span className="text-data-mono">{Math.max(1, Math.ceil(wordCount / 200))} min</span>
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="card-base">
            <h3 className="text-title-lg" style={{ marginBottom: 16 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', marginRight: 8 }}>tips_and_updates</span>
              Writing Tips
            </h3>
            <ul className="write-essay__tips">
              <li>Use varied vocabulary to improve your TTR score</li>
              <li>Aim for at least 500 words per essay</li>
              <li>Include topic-specific terminology</li>
              <li>Practice complex sentence structures</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
