import { useRef, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import useDailyQuest from './useDailyQuest.js'
import { cellsFor, gridFor } from './questGrid.js'
import './DailyWordQuest.css'
import confetti from 'canvas-confetti'
import { useSound } from '../../hooks/useSound.jsx'

export default function DailyWordQuest() {
  const { t, language } = useLanguage(),
    navigate = useNavigate()
  const { quest, cells, edit, loading, error, busy, dirty, play, reload } = useDailyQuest()
  const [selected, setSelected] = useState(null),
    [feedback, setFeedback] = useState(''),
    [showExample, setShowExample] = useState(false)
  const [inputDraft, setInputDraft] = useState(null)
  const inputRef = useRef(null)
  const { play: playFanfare } = useSound('/sounds/fanfare.mp3', { volume: 0.5 })
  const [flippedCells, setFlippedCells] = useState(new Set())
  const prevSolvedRef = useRef([])
  const word = quest?.words.find((w) => w.id === selected) || quest?.words[0]
  const wordKeys = word ? cellsFor(word) : []
  const solved = quest?.solved.includes(word?.id)
  const blocked = Boolean(busy && busy !== 'save') || [409, 410].includes(error?.status)
  const grid = quest ? gridFor(quest) : {}
  const locked = new Set(
    quest?.words.filter((w) => quest.solved.includes(w.id)).flatMap(cellsFor) || [],
  )
  const clue = (w) => (language === 'vi' && w.clueVi ? w.clueVi : w.clue)
  const choose = (id) => {
    setSelected(id)
    setInputDraft(null)
    setFeedback('')
    setShowExample(false)
    requestAnimationFrame(() => inputRef.current?.focus())
  }
  const leave = async () => {
    if (!dirty || (await play('save'))) navigate('/student/game')
  }
  const submit = async (action) => {
    const result = await play(action, word.id)
    if (result) {
      setInputDraft(null)
      setFeedback(action === 'hint' ? 'revealed' : result.correct ? 'correct' : 'incorrect')
    }
  }
  const change = (value) => {
    const letters = value
      .toUpperCase()
      .replace(/[^A-Z ]/g, '')
      .slice(0, word.length)
    // Keep the typed text independent of locked crossing cells to preserve the caret.
    setInputDraft({ id: word.id, value: letters })
    const next = { ...cells }
    wordKeys.forEach((key, i) => {
      if (!locked.has(key)) {
        if (letters[i] && letters[i] !== ' ') next[key] = letters[i]
        else delete next[key]
      }
    })
    edit(next)
    setFeedback('')
  }
  const value =
    !solved && inputDraft && inputDraft.id === word?.id
      ? inputDraft.value
      : wordKeys
          .map((key) => cells[key] || ' ')
          .join('')
          .trimEnd()

  // Track solved words to trigger confetti and flip animation
  useEffect(() => {
    if (!quest) return
    const solvedIds = quest.solved || []
    const prevSolved = prevSolvedRef.current

    // Check for new solves
    const newSolves = solvedIds.filter(id => !prevSolved.includes(id))
    if (newSolves.length > 0) {
      // Trigger confetti for each new solve
      newSolves.forEach((wordId) => {
        const wordObj = quest.words.find(w => w.id === wordId)
        if (wordObj) {
          const keys = cellsFor(wordObj)
          // Add to flipped set for animation
          setFlippedCells(prev => {
            const newSet = new Set(prev)
            keys.forEach(key => newSet.add(key))
            return newSet
          })
        }
      })

      // Fire confetti if all words are solved
      const allSolved = quest.words.every(w => solvedIds.includes(w.id))
      if (allSolved) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
        playFanfare()
        // Extra burst
        setTimeout(() => {
          confetti({
            particleCount: 50,
            spread: 50,
            origin: { y: 0.4 }
          })
        }, 300)
      }
    }

    prevSolvedRef.current = solvedIds
  }, [quest, playFanfare])

  return (
    <div className="daily-quest">
      <button className="quest-back" onClick={leave} disabled={Boolean(busy)}>
        <span aria-hidden="true">←</span> {t('quest.back')}
      </button>
      <header className="quest-heading">
        <span className="quest-eyebrow">{t('quest.daily')}</span>
        <h1>{t('quest.title')}</h1>
        <p>{t('quest.subtitle')}</p>
      </header>
      {error && (
        <div className="quest-error" role="alert">
          <p>
            {t(
              error.status === 409
                ? 'quest.conflict'
                : error.status === 410
                  ? 'quest.expired'
                  : 'quest.networkError',
            )}
          </p>
          <button
            className="quest-secondary"
            disabled={Boolean(busy)}
            onClick={() => {
              setInputDraft(null)
              return error.status === 409 || error.status === 410 || !quest
                ? reload()
                : play('save')
            }}
          >
            {t(
              error.status === 409 || error.status === 410 || !quest
                ? 'quest.reload'
                : 'quest.retry',
            )}
          </button>
        </div>
      )}
      {loading ? (
        <div className="quest-loading" role="status">
          {t('quest.loading')}
          <div />
          <div />
          <div />
        </div>
      ) : !quest ? null : quest.completedAt ? (
        <section className="quest-results">
          <div className="quest-result-icon" aria-hidden="true">
            ✦
          </div>
          <span className="quest-eyebrow">{t('quest.complete')}</span>
          <h2>{t('quest.rewardTitle')}</h2>
          <p>{t('quest.rewardDescription')}</p>
          <div className="quest-result-stats">
            <div>
              <strong>{quest.solved.length - quest.assisted.length}</strong>
              <span>{t('quest.independent')}</span>
            </div>
            <div>
              <strong>{quest.assisted.length}</strong>
              <span>{t('quest.assisted')}</span>
            </div>
          </div>
          <div className="quest-review">
            {quest.words.map((w) => (
              <article key={w.id}>
                <div>
                  <strong lang="en">{w.answer.toLowerCase()}</strong>
                  <span>
                    {t(quest.assisted.includes(w.id) ? 'quest.assisted' : 'quest.independent')}
                  </span>
                </div>
                <p>{clue(w)}</p>
                {w.example && (
                  <small lang="en">{w.example.replaceAll('_____', w.answer.toLowerCase())}</small>
                )}
              </article>
            ))}
          </div>
          <Link to="/student/garden" className="quest-primary">
            {t('quest.visitGarden')} <span aria-hidden="true">→</span>
          </Link>
          <p className="quest-muted">{t('quest.tomorrow')}</p>
        </section>
      ) : (
        <>
          <div className="quest-meta">
            <span>
              {quest.day} · {t('quest.reset')}
            </span>
            <span aria-live="polite">
              {t(busy ? 'quest.saving' : dirty ? 'quest.unsaved' : 'quest.saved')}
            </span>
          </div>
          <div className="quest-progress">
            <label htmlFor="quest-progress">
              {quest.solved.length}/{quest.words.length} {t('quest.solved')}
            </label>
            <progress id="quest-progress" value={quest.solved.length} max={quest.words.length} />
            <span>✦ {t('quest.rewardShort')}</span>
          </div>
          {!quest.startedAt && <p className="quest-instructions">{t('quest.instructions')}</p>}
          <div className="quest-play-layout">
            <section className="quest-board" aria-label={t('quest.grid')}>
              <div className="quest-grid" style={{ '--quest-cols': quest.cols }}>
                {Array.from({ length: quest.rows * quest.cols }, (_, i) => {
                  const key = `${Math.floor(i / quest.cols)},${i % quest.cols}`,
                    cell = grid[key]
                  if (!cell) return <span className="quest-cell-empty" key={key} />
                  return (
                    <button
                      key={key}
                      className={`quest-cell ${wordKeys.includes(key) ? 'is-selected' : ''} ${locked.has(key) ? 'is-solved' : ''}`}
                      aria-label={`${t('quest.row')} ${Math.floor(i / quest.cols) + 1}, ${t('quest.column')} ${(i % quest.cols) + 1}: ${cells[key] || t('quest.blank')}`}
                      aria-pressed={wordKeys.includes(key)}
                      onClick={() =>
                        choose(cell.words.find((id) => id !== word.id) || cell.words[0])
                      }
                    >
                      {cell.number && <small>{cell.number}</small>}
                      <span>{cells[key] || ''}</span>
                    </button>
                  )
                })}
              </div>
              <p className="quest-board-note">{t('quest.gridTip')}</p>
            </section>
            <section className="quest-clue-panel">
              <div className="quest-active-clue">
                <span className="quest-eyebrow">
                  {word.number} · {t(`quest.${word.direction}`)} · {word.length}{' '}
                  {t('quest.letters')}
                </span>
                <h2 id="quest-clue">{clue(word)}</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!blocked && !busy && !solved) submit('check')
                  }}
                >
                  <label htmlFor="quest-answer">{t('quest.answer')}</label>
                  <input
                    ref={inputRef}
                    id="quest-answer"
                    aria-describedby="quest-clue"
                    value={value}
                    onChange={(e) => change(e.target.value)}
                    disabled={blocked || solved}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    maxLength={word.length}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                        e.preventDefault()
                        const index = quest.words.findIndex((w) => w.id === word.id)
                        choose(
                          quest.words[
                            (index + (e.key === 'ArrowDown' ? 1 : quest.words.length - 1)) %
                              quest.words.length
                          ].id,
                        )
                      }
                    }}
                  />
                  <div className="quest-actions">
                    <button
                      className="quest-primary"
                      type="submit"
                      disabled={Boolean(busy) || blocked || solved}
                    >
                      {t(solved ? 'quest.checked' : 'quest.check')}
                    </button>
                    <button
                      className="quest-secondary"
                      type="button"
                      disabled={!word.example}
                      onClick={() => setShowExample(!showExample)}
                    >
                      {t('quest.context')}
                    </button>
                  </div>
                </form>
                {showExample && (
                  <p className="quest-example" lang="en">
                    {word.example}
                  </p>
                )}
                <p className="quest-feedback" role="status">
                  {feedback
                    ? t(`quest.${feedback}`)
                    : solved
                      ? t('quest.correct')
                      : t('quest.noTimer')}
                </p>
                {!solved && (
                  <button
                    className="quest-reveal"
                    disabled={Boolean(busy) || blocked}
                    onClick={() => submit('hint')}
                  >
                    {t('quest.reveal')}
                  </button>
                )}
              </div>
              <div className="quest-clue-list" aria-label={t('quest.clues')}>
                {quest.words.map((w) => (
                  <button
                    key={w.id}
                    className={w.id === word.id ? 'is-active' : ''}
                    aria-pressed={w.id === word.id}
                    onClick={() => choose(w.id)}
                  >
                    <span className="quest-clue-number">
                      {w.number}
                      {w.direction === 'across' ? '→' : '↓'}
                    </span>
                    <span>{clue(w)}</span>
                    <span
                      aria-label={
                        quest.solved.includes(w.id) ? t('quest.checked') : t('quest.blank')
                      }
                    >
                      {quest.solved.includes(w.id) ? '✓' : '○'}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
          <p className="quest-muted">{t('quest.learningNote')}</p>
        </>
      )}
    </div>
  )
}
