import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import './VocabularyLibrary.css'

export default function VocabularyLibrary() {
  const navigate = useNavigate()
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(true)

  // Pagination states
  const [page, setPage] = useState(1)
  const [limit] = useState(24)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [dueCount, setDueCount] = useState(0)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
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

  // Search input debounce (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, selectedCategory, selectedMastery, selectedTheme])

  // Fetch paginated vocabulary from server
  const fetchVocabulary = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', page)
      params.append('limit', limit)
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim())
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedMastery) params.append('mastery', selectedMastery)
      if (selectedTheme) params.append('theme', selectedTheme)

      const response = await api.get(`/vocabulary?${params.toString()}`)
      if (response.success) {
        setWords(response.data || [])
        setTotalCount(response.total || 0)
        setTotalPages(response.pages || 1)
        if (response.themes && response.themes.length > 0) {
          setThemesList(response.themes)
        }
        if (response.dueCount !== undefined) {
          setDueCount(response.dueCount)
        }
      }
    } catch (err) {
      console.error('Error fetching vocabulary:', err)
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, selectedCategory, selectedMastery, selectedTheme])

  useEffect(() => {
    fetchVocabulary()
  }, [fetchVocabulary])

  // Handle Mastery level update
  const handleUpdateMastery = async (wordId, newMastery) => {
    try {
      const response = await api.patch(`/vocabulary/${wordId}`, { masteryLevel: newMastery })
      if (response.success) {
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
        fetchVocabulary()
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

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getCategoryLabel = (cat) => {
    if (!cat) return 'All'
    return cat.charAt(0).toUpperCase() + cat.slice(1)
  }

  // Generate numeric page pagination items with ellipsis
  const getPageNumbers = () => {
    const pages = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (page <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages)
      } else if (page >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages)
      }
    }
    return pages
  }

  const startIndex = totalCount === 0 ? 0 : (page - 1) * limit + 1
  const endIndex = Math.min(page * limit, totalCount)

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
          {dueCount > 0 && (
            <button
              className="vocab-lib__review-btn"
              onClick={() => {
                const targetQuery = selectedCategory ? `?category=${selectedCategory}` : ''
                navigate(`/student/vocabulary/review${targetQuery}`)
              }}
            >
              <span className="material-symbols-outlined">style</span>
              <span>Review {selectedCategory ? getCategoryLabel(selectedCategory) : 'All'}</span>
              <span className="vocab-lib__review-badge">{dueCount}</span>
            </button>
          )}
          <button
            className="vocab-lib__game-btn"
            onClick={() => navigate('/student/game')}
          >
            <span className="material-symbols-outlined">sports_esports</span>
            <span>Play Games</span>
          </button>
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
          {searchTerm && (
            <button
              type="button"
              className="vocab-lib__search-clear"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
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
      ) : words.length === 0 ? (
        <div className="vocab-lib__empty card-base">
          <span className="material-symbols-outlined vocab-lib__empty-icon">menu_book</span>
          <h3 className="text-title-lg">No words found</h3>
          <p className="text-body-md" style={{ color: 'var(--color-outline)' }}>
            Try adjusting your filters, searching for something else, or adding a new word.
          </p>
        </div>
      ) : (
        <>
          <div className="vocab-lib__meta-row">
            <span className="vocab-lib__meta-count">
              Showing <strong>{startIndex}–{endIndex}</strong> of <strong>{totalCount}</strong> words
            </span>
          </div>

          <section className="vocab-lib__grid">
            {words.map((item) => {
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="vocab-lib__pagination card-base">
              <div className="vocab-pagination__info">
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </div>

              <div className="vocab-pagination__controls">
                <button
                  type="button"
                  className="vocab-pagination__btn vocab-pagination__btn--nav"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                  <span>Prev</span>
                </button>

                <div className="vocab-pagination__numbers">
                  {getPageNumbers().map((p, idx) => {
                    if (p === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="vocab-pagination__ellipsis">
                          …
                        </span>
                      )
                    }
                    return (
                      <button
                        key={p}
                        type="button"
                        className={`vocab-pagination__btn vocab-pagination__btn--num ${p === page ? 'vocab-pagination__btn--active' : ''}`}
                        onClick={() => handlePageChange(p)}
                      >
                        {p}
                      </button>
                    )
                  })}
                </div>

                <button
                  type="button"
                  className="vocab-pagination__btn vocab-pagination__btn--nav"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                >
                  <span>Next</span>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Word Detail Modal */}
      {selectedWord && createPortal(
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
        </div>,
        document.body
      )}

      {/* Add New Word Modal */}
      {isAddModalOpen && createPortal(
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
        </div>,
        document.body
      )}
    </div>
  )
}
