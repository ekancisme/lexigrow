import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import './VocabularyLibrary.css'

export default function VocabularyLibrary() {
  const navigate = useNavigate()
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedMastery, setSelectedMastery] = useState('')
  const [selectedTheme, setSelectedTheme] = useState('')
  const [themesList, setThemesList] = useState([])

  // Modal States
  const [selectedWord, setSelectedWord] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newWordData, setNewWordData] = useState({
    word: '',
    category: 'daily',
    theme: 'General',
  })
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState('')

  // Load vocabulary
  const fetchVocabulary = async () => {
    try {
      setLoading(true)
      // We fetch all to let the client extract themes dynamically
      // or we can query with filters
      const response = await api.get('/vocabulary?limit=500')
      if (response.success) {
        setWords(response.data || [])
        // Extract unique themes
        const themes = Array.from(new Set((response.data || []).map(w => w.theme).filter(Boolean)))
        setThemesList(themes)
      }
    } catch (err) {
      console.error('Error fetching vocabulary:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVocabulary()
  }, [])

  // Handle Mastery level update
  const handleUpdateMastery = async (wordId, newMastery) => {
    try {
      const response = await api.patch(`/vocabulary/${wordId}`, { masteryLevel: newMastery })
      if (response.success) {
        // Update local state
        setWords(prev => prev.map(w => w._id === wordId ? { ...w, masteryLevel: newMastery } : w))
        if (selectedWord && selectedWord._id === wordId) {
          setSelectedWord(prev => ({ ...prev, masteryLevel: newMastery }))
        }
      }
    } catch (err) {
      console.error('Error updating mastery level:', err)
    }
  }

  // Handle Add New Word submission
  const handleAddWord = async (e) => {
    e.preventDefault()
    if (!newWordData.word.trim()) return

    try {
      setIsAdding(true)
      setAddError('')
      const response = await api.post('/vocabulary', newWordData)
      if (response.success) {
        setIsAddModalOpen(false)
        setNewWordData({ word: '', category: 'daily', theme: 'General' })
        fetchVocabulary() // Refresh list
      }
    } catch (err) {
      setAddError(err.message || 'Failed to add word')
    } finally {
      setIsAdding(false)
    }
  }

  // Speak word using Web Speech Synthesis API
  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleCloseDetail = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setSelectedWord(null)
  }

  // Filtered words to display
  const filteredWords = words.filter(item => {
    const matchesSearch = item.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.definition && item.definition.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = !selectedCategory || item.category === selectedCategory
    const matchesMastery = !selectedMastery || item.masteryLevel === selectedMastery
    const matchesTheme = !selectedTheme || item.theme === selectedTheme
    return matchesSearch && matchesCategory && matchesMastery && matchesTheme
  })

  // Đếm số từ cần ôn (new + learning) theo Category đang chọn
  const reviewCount = words.filter(w => {
    const matchesCategory = !selectedCategory || w.category === selectedCategory
    const matchesMastery = w.masteryLevel === 'new' || w.masteryLevel === 'learning'
    return matchesCategory && matchesMastery
  }).length

  const getCategoryLabel = (cat) => {
    if (!cat) return 'All'
    return cat.charAt(0).toUpperCase() + cat.slice(1)
  }

  return (
    <div className="vocab-lib animate-fade-in">
      {/* Header */}
      <section className="vocab-lib__header">
        <div>
          <h2 className="text-headline-lg">Vocabulary Library</h2>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
            Expand your lexicon. Add words manually or write essays to discover new vocabulary.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Start Review Button */}
          {reviewCount > 0 && (
            <button
              className="vocab-lib__review-btn"
              onClick={() => {
                const targetQuery = selectedCategory ? `?category=${selectedCategory}` : ''
                navigate(`/student/vocabulary/review${targetQuery}`)
              }}
            >
              <span className="material-symbols-outlined">style</span>
              <span>Review {selectedCategory ? getCategoryLabel(selectedCategory) : 'All'}</span>
              <span className="vocab-lib__review-badge">{reviewCount}</span>
            </button>
          )}
          <button 
            className="vocab-lib__add-btn" 
            onClick={() => setIsAddModalOpen(true)}
          >
            <span className="material-symbols-outlined">add</span>
            <span>Add New Word</span>
          </button>
        </div>
      </section>

      {/* Filter and Search Section */}
      <section className="vocab-lib__search card-base">
        <div className="vocab-lib__search-input-wrapper">
          <span className="material-symbols-outlined vocab-lib__search-icon">search</span>
          <input 
            type="text" 
            placeholder="Search word or definition..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="vocab-lib__search-field"
          />
        </div>
        <div className="vocab-lib__filters">
          <div className="vocab-lib__filter-group">
            <label className="text-label-sm">Category</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="vocab-lib__select"
            >
              <option value="">All Categories</option>
              <option value="academic">Academic</option>
              <option value="business">Business</option>
              <option value="scientific">Scientific</option>
              <option value="daily">Daily Use</option>
            </select>
          </div>

          <div className="vocab-lib__filter-group">
            <label className="text-label-sm">Mastery</label>
            <select 
              value={selectedMastery} 
              onChange={(e) => setSelectedMastery(e.target.value)}
              className="vocab-lib__select"
            >
              <option value="">All Mastery Levels</option>
              <option value="new">New</option>
              <option value="learning">Learning</option>
              <option value="mastered">Mastered</option>
            </select>
          </div>

          <div className="vocab-lib__filter-group">
            <label className="text-label-sm">Theme</label>
            <select 
              value={selectedTheme} 
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="vocab-lib__select"
            >
              <option value="">All Themes</option>
              {themesList.map(theme => (
                <option key={theme} value={theme}>{theme}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Grid of cards */}
      {loading ? (
        <div className="vocab-lib__loading">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          <p className="text-body-md">Loading your library...</p>
        </div>
      ) : filteredWords.length === 0 ? (
        <div className="vocab-lib__empty card-base">
          <span className="material-symbols-outlined vocab-lib__empty-icon">menu_book</span>
          <h3 className="text-title-lg">No words found</h3>
          <p className="text-body-md" style={{ color: 'var(--color-outline)' }}>
            Try adjusting your filters, searching for something else, or adding a new word.
          </p>
        </div>
      ) : (
        <section className="vocab-lib__grid">
          {filteredWords.map((item) => {
            const mastery = item.masteryLevel || 'new'
            return (
              <div 
                key={item._id} 
                className={`vocab-card vocab-card--${mastery}`}
                onClick={() => setSelectedWord(item)}
              >
                <div className="vocab-card__top">
                  <span className={`vocab-card__tag vocab-card__tag--cat`}>{item.category}</span>
                  <span className="vocab-card__tag vocab-card__tag--theme">{item.theme}</span>
                </div>
                <h3 className="vocab-card__word">{item.word}</h3>
                {item.ipa && <p className="vocab-card__ipa">{item.ipa}</p>}
                {item.partOfSpeech && <span className="vocab-card__pos">{item.partOfSpeech}</span>}
                <p className="vocab-card__def truncate">{item.definition || 'No definition loaded yet.'}</p>
                <div className="vocab-card__footer">
                  <span className={`vocab-card__badge vocab-card__badge--${mastery}`}>
                    <span className="material-symbols-outlined">
                      {mastery === 'mastered' ? 'verified' : mastery === 'learning' ? 'school' : 'new_releases'}
                    </span>
                    <span>{mastery.toUpperCase()}</span>
                  </span>
                </div>
              </div>
            )
          })}
        </section>
      )}

      {/* Word Detail Modal */}
      {selectedWord && (
        <div className="vocab-modal-overlay" onClick={handleCloseDetail}>
          <div className="vocab-modal vocab-modal--detail animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <button className="vocab-modal__close" onClick={handleCloseDetail}>
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <div className="vocab-modal__header-row">
              <div>
                <h2 className="vocab-modal__word">{selectedWord.word}</h2>
                <div className="vocab-modal__subheaders">
                  {selectedWord.ipa && (
                    <span className="vocab-modal__ipa">
                      {selectedWord.ipa}
                      <button className="vocab-modal__audio-btn" onClick={() => handleSpeak(selectedWord.word)}>
                        <span className="material-symbols-outlined">volume_up</span>
                      </button>
                    </span>
                  )}
                  {selectedWord.partOfSpeech && <span className="vocab-modal__pos">{selectedWord.partOfSpeech}</span>}
                </div>
              </div>
              <span className={`vocab-card__tag vocab-card__tag--cat`}>{selectedWord.category}</span>
            </div>

            <hr className="vocab-modal__divider" />

            <div className="vocab-modal__content">
              {/* Definition */}
              <div className="vocab-modal__section">
                <h4 className="text-label-sm vocab-modal__section-title">Definition</h4>
                <p className="text-body-md vocab-modal__text">{selectedWord.definition || 'No definition available.'}</p>
              </div>

              {/* Example */}
              {selectedWord.exampleSentence && (
                <div className="vocab-modal__section">
                  <h4 className="text-label-sm vocab-modal__section-title">Context Example</h4>
                  <p className="text-body-md vocab-modal__text vocab-modal__text--example">
                    "{selectedWord.exampleSentence}"
                  </p>
                </div>
              )}

              {/* Synonyms & Antonyms */}
              <div className="vocab-modal__syn-ant">
                {selectedWord.synonyms && selectedWord.synonyms.length > 0 && (
                  <div className="vocab-modal__syn-ant-col">
                    <h4 className="text-label-sm vocab-modal__section-title">Synonyms</h4>
                    <div className="vocab-modal__tags-list">
                      {selectedWord.synonyms.map(s => (
                        <span key={s} className="vocab-modal__tag vocab-modal__tag--syn">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedWord.antonyms && selectedWord.antonyms.length > 0 && (
                  <div className="vocab-modal__syn-ant-col">
                    <h4 className="text-label-sm vocab-modal__section-title">Antonyms</h4>
                    <div className="vocab-modal__tags-list">
                      {selectedWord.antonyms.map(a => (
                        <span key={a} className="vocab-modal__tag vocab-modal__tag--ant">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mastery toggle */}
              <div className="vocab-modal__section vocab-modal__mastery-section">
                <h4 className="text-label-sm vocab-modal__section-title">Mastery Level</h4>
                <div className="vocab-modal__mastery-options">
                  {['new', 'learning', 'mastered'].map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      className={`vocab-modal__mastery-btn vocab-modal__mastery-btn--${lvl} ${selectedWord.masteryLevel === lvl ? 'vocab-modal__mastery-btn--active' : ''}`}
                      onClick={() => handleUpdateMastery(selectedWord._id, lvl)}
                    >
                      <span className="material-symbols-outlined">
                        {lvl === 'mastered' ? 'verified' : lvl === 'learning' ? 'school' : 'new_releases'}
                      </span>
                      <span>{lvl.charAt(0).toUpperCase() + lvl.slice(1)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Word Modal */}
      {isAddModalOpen && (
        <div className="vocab-modal-overlay" onClick={() => !isAdding && setIsAddModalOpen(false)}>
          <div className="vocab-modal vocab-modal--add animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <button className="vocab-modal__close" onClick={() => !isAdding && setIsAddModalOpen(false)} disabled={isAdding}>
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-title-lg" style={{ marginBottom: 16 }}>Add New Word</h3>
            
            {addError && <div className="vocab-modal__error">{addError}</div>}

            <form onSubmit={handleAddWord}>
              <div className="vocab-modal__form-group">
                <label className="text-label-sm">Word</label>
                <input 
                  type="text" 
                  placeholder="Enter english word..." 
                  value={newWordData.word}
                  onChange={(e) => setNewWordData(prev => ({ ...prev, word: e.target.value }))}
                  required
                  disabled={isAdding}
                  className="vocab-modal__input"
                  autoFocus
                />
              </div>

              <div className="vocab-modal__form-row">
                <div className="vocab-modal__form-group">
                  <label className="text-label-sm">Category</label>
                  <select 
                    value={newWordData.category}
                    onChange={(e) => setNewWordData(prev => ({ ...prev, category: e.target.value }))}
                    disabled={isAdding}
                    className="vocab-modal__select-input"
                  >
                    <option value="daily">Daily Use</option>
                    <option value="academic">Academic</option>
                    <option value="business">Business</option>
                    <option value="scientific">Scientific</option>
                  </select>
                </div>

                <div className="vocab-modal__form-group">
                  <label className="text-label-sm">Theme</label>
                  <input 
                    type="text" 
                    placeholder="General, Travel, Tech..." 
                    value={newWordData.theme}
                    onChange={(e) => setNewWordData(prev => ({ ...prev, theme: e.target.value }))}
                    disabled={isAdding}
                    className="vocab-modal__input"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="vocab-modal__submit-btn"
                disabled={isAdding || !newWordData.word.trim()}
              >
                {isAdding ? (
                  <>
                    <span className="material-symbols-outlined animate-spin" style={{ marginRight: 8 }}>progress_activity</span>
                    <span>AI Enriching Word Details...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">auto_awesome</span>
                    <span>Add Word & Enrich with AI</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
