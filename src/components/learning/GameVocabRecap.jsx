import { useState, useEffect, useMemo } from 'react'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import api from '../../services/api.js'
import { fetchAllVocabularyWords } from '../../utils/fetchAllVocabularyWords.js'
import './GameVocabRecap.css'

export default function GameVocabRecap({
  words = [],
  title,
  sourceLabel = '',
  defaultTheme = 'Game Discovery',
  defaultCategory = 'daily',
  onWordAdded,
}) {
  const { t } = useLanguage()
  const [existingWords, setExistingWords] = useState(new Set())
  const [addedWords, setAddedWords] = useState(new Set())
  const [loadingWords, setLoadingWords] = useState(new Set())
  const [batchLoading, setBatchLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false)
  const [libraryLoadError, setLibraryLoadError] = useState(false)

  const loadLibrary = async () => {
    setIsLibraryLoaded(false)
    setLibraryLoadError(false)
    try {
      const words = await fetchAllVocabularyWords(api)
      setExistingWords(new Set(words.map((w) => w.word.toLowerCase().trim())))
    } catch (err) {
      console.warn('Could not load vocabulary library for recap comparison', err)
      setLibraryLoadError(true)
    } finally {
      setIsLibraryLoaded(true)
    }
  }

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setIsLibraryLoaded(false)
      setLibraryLoadError(false)
      try {
        const words = await fetchAllVocabularyWords(api)
        if (isMounted) setExistingWords(new Set(words.map((w) => w.word.toLowerCase().trim())))
      } catch (err) {
        console.warn('Could not load vocabulary library for recap comparison', err)
        if (isMounted) setLibraryLoadError(true)
      } finally {
        if (isMounted) setIsLibraryLoaded(true)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

  // Deduplicate words list by lowercase word
  const uniqueWords = useMemo(() => {
    const seen = new Set()
    const result = []
    for (const item of words) {
      if (!item) continue
      const rawWord = typeof item === 'string' ? item : item.word
      if (!rawWord) continue
      const norm = rawWord.trim().toLowerCase()
      if (!seen.has(norm)) {
        seen.add(norm)
        result.push(typeof item === 'string' ? { word: norm } : item)
      }
    }
    return result
  }, [words])

  // Compute how many words are not yet in library or added in this session
  const newWords = useMemo(() => {
    return uniqueWords.filter((item) => {
      const norm = item.word.trim().toLowerCase()
      return !existingWords.has(norm) && !addedWords.has(norm)
    })
  }, [uniqueWords, existingWords, addedWords])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  // Handle single word add
  const handleAddSingle = async (item) => {
    const norm = item.word.trim().toLowerCase()
    if (!isLibraryLoaded || libraryLoadError || loadingWords.has(norm) || existingWords.has(norm) || addedWords.has(norm)) return

    setLoadingWords((prev) => new Set([...prev, norm]))
    try {
      const payload = {
        word: norm,
        definition: item.definition || item.meaningVi || item.meaning || '',
        ipa: item.ipa || '',
        partOfSpeech: item.partOfSpeech || '',
        exampleSentence: item.exampleSentence || (Array.isArray(item.examples) ? item.examples[0] : '') || '',
        theme: item.theme || defaultTheme,
        category: item.category || defaultCategory,
      }

      const res = await api.post('/vocabulary', payload)
      if (res.success) {
        setAddedWords((prev) => new Set([...prev, norm]))
        showToast(t('learning.addedToast', { word: item.word }))
        if (onWordAdded) onWordAdded(item)
      }
    } catch (err) {
      console.error('Failed to add word to library', err)
      showToast(err.message || t('learning.addFailedToast', { word: item.word }))
    } finally {
      setLoadingWords((prev) => {
        const next = new Set(prev)
        next.delete(norm)
        return next
      })
    }
  }

  // Handle bulk add
  const handleAddAll = async () => {
    if (batchLoading || !isLibraryLoaded || libraryLoadError || newWords.length === 0) return

    setBatchLoading(true)
    try {
      const payload = {
        words: newWords.map((item) => ({
          word: item.word.trim().toLowerCase(),
          definition: item.definition || item.meaningVi || item.meaning || '',
          ipa: item.ipa || '',
          partOfSpeech: item.partOfSpeech || '',
          exampleSentence: item.exampleSentence || (Array.isArray(item.examples) ? item.examples[0] : '') || '',
          theme: item.theme || defaultTheme,
          category: item.category || defaultCategory,
        })),
        theme: defaultTheme,
        category: defaultCategory,
      }

      const res = await api.post('/vocabulary/batch', payload)
      if (res.success) {
        const createdWords = Array.isArray(res.data) ? res.data : []
        const newlyAdded = new Set(createdWords.map((w) => w.word.trim().toLowerCase()))
        setAddedWords((prev) => new Set([...prev, ...newlyAdded]))
        await loadLibrary()
        const insertedCount = Number.isFinite(res.count) ? res.count : createdWords.length
        showToast(insertedCount > 0
          ? t('learning.batchSavedToast', { count: insertedCount })
          : t('learning.wordsAlreadyInLibrary'))
        if (createdWords.length && onWordAdded) onWordAdded(createdWords)
      }
    } catch (err) {
      console.error('Batch add failed', err)
      showToast(err.message || t('learning.batchSaveFailed'))
    } finally {
      setBatchLoading(false)
    }
  }

  if (!uniqueWords.length) return null

  return (
    <div className="game-vocab-recap">
      {/* Toast notification */}
      {toastMessage && <div className="game-vocab-recap__toast">{toastMessage}</div>}

      {/* Recap Header */}
      <div className="game-vocab-recap__header">
        <div className="game-vocab-recap__title-wrap">
          <div className="game-vocab-recap__badge">
            <span className="material-symbols-outlined">menu_book</span>
            <span>{sourceLabel || t('learning.gameVocabBadge')}</span>
          </div>
          <h3 className="game-vocab-recap__title">{title || t('learning.recapTitle')}</h3>
          <p className="game-vocab-recap__subtitle" aria-live="polite">
            {!isLibraryLoaded
              ? t('learning.checkingLibrary')
              : libraryLoadError
                ? t('learning.libraryCheckError')
                : t('learning.wordsAppeared', { total: uniqueWords.length, newCount: newWords.length })}
          </p>
          {libraryLoadError && (
            <button className="game-vocab-recap__add-btn" onClick={loadLibrary}>
              {t('learning.retryLibrary')}
            </button>
          )}
        </div>

        {/* Batch Save Button */}
        {newWords.length > 0 ? (
          <button
            className="game-vocab-recap__bulk-btn"
            onClick={handleAddAll}
            disabled={batchLoading || !isLibraryLoaded || libraryLoadError}
          >
            {batchLoading ? (
              <>
                <span className="material-symbols-outlined spin">progress_activity</span>
                <span>{t('learning.savingWords')}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">bookmark_add</span>
                <span>{t('learning.saveAllNew', { count: newWords.length })}</span>
              </>
            )}
          </button>
        ) : isLibraryLoaded && !libraryLoadError ? (
          <div className="game-vocab-recap__all-saved-pill">
            <span className="material-symbols-outlined">check_circle</span>
            <span>{t('learning.allSavedInLibrary')}</span>
          </div>
        ) : null}
      </div>

      {/* Word Grid */}
      <div className="game-vocab-recap__grid">
        {uniqueWords.map((item) => {
          const norm = item.word.trim().toLowerCase()
          const isExisting = existingWords.has(norm)
          const isJustAdded = addedWords.has(norm)
          const isLoading = loadingWords.has(norm)

          return (
            <div
              key={norm}
              className={`game-vocab-recap__card ${
                isExisting || isJustAdded ? 'game-vocab-recap__card--saved' : ''
              }`}
            >
              <div className="game-vocab-recap__card-top">
                <div className="game-vocab-recap__word-line">
                  <span className="game-vocab-recap__word">{item.word}</span>
                  {item.partOfSpeech && (
                    <span className="game-vocab-recap__pos">{item.partOfSpeech}</span>
                  )}
                </div>
                {item.ipa && <span className="game-vocab-recap__ipa">{item.ipa}</span>}
              </div>

              <div className="game-vocab-recap__definition">
                {item.definition || item.meaningVi || item.meaning || t('learning.noDefinition')}
              </div>

              {(item.exampleSentence || (item.examples && item.examples[0])) && (
                <div className="game-vocab-recap__example">
                  "{item.exampleSentence || item.examples[0]}"
                </div>
              )}

              <div className="game-vocab-recap__card-actions">
                {isExisting ? (
                  <span className="game-vocab-recap__status-badge game-vocab-recap__status-badge--existing">
                    <span className="material-symbols-outlined">check</span>
                    <span>{t('learning.alreadyInLibrary')}</span>
                  </span>
                ) : isJustAdded ? (
                  <span className="game-vocab-recap__status-badge game-vocab-recap__status-badge--added">
                    <span className="material-symbols-outlined">done_all</span>
                    <span>{t('learning.addedToLibrary')}</span>
                  </span>
                ) : (
                  <button
                    className="game-vocab-recap__add-btn"
                    onClick={() => handleAddSingle(item)}
                    disabled={isLoading || batchLoading || !isLibraryLoaded || libraryLoadError}
                  >
                    {isLoading ? (
                      <>
                        <span className="material-symbols-outlined spin">progress_activity</span>
                        <span>{t('learning.addingWord')}</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">add</span>
                        <span>{t('learning.addToLibrary')}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
