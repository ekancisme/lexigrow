import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import api from '../../services/api.js'
import { TOPIC_VOCABULARY_ROUNDS, getTopicRound } from '../../data/topicVocabularyRounds.js'
import './Explore.css'

const fallbackTopicSets = [
  {
    slug: 'daily-life',
    title: 'Daily Life & Routines',
    titleVi: 'Sinh hoạt hàng ngày, đi lại & năng suất',
    level: 'A2',
    levelColor: 'a2',
    icon: 'routine',
    materialIcon: 'wb_sunny',
    description: 'Master essential expressions for daily routines, commuting to work/school, and maintaining high productivity.',
    words: [
      { word: 'routine', meaning: 'Daily habits' },
      { word: 'commute', meaning: 'Travel to work/school' },
      { word: 'productive', meaning: 'High efficiency' },
      { word: 'efficient', meaning: 'Time-saving' }
    ],
    timeEstimate: '10 mins',
    bgGradient: 'linear-gradient(135deg, #005bbf 0%, #1a73e8 100%)'
  },
  {
    slug: 'travel',
    title: 'Travel & Exploration',
    titleVi: 'Du lịch, lịch trình & trải nghiệm',
    level: 'B1',
    levelColor: 'b1',
    icon: 'travel',
    materialIcon: 'flight_takeoff',
    description: 'Describe famous landmarks, detailed travel itineraries, and reserving hotel rooms.',
    words: [
      { word: 'itinerary', meaning: 'Trip schedule' },
      { word: 'accommodation', meaning: 'Lodging' },
      { word: 'landmark', meaning: 'Famous site' }
    ],
    timeEstimate: '10 mins',
    bgGradient: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)'
  },
  {
    slug: 'hobbies',
    title: 'Hobbies & Creative Arts',
    titleVi: 'Sở thích, thư giãn & nghệ thuật',
    level: 'B1',
    levelColor: 'b1',
    icon: 'hobbies',
    materialIcon: 'palette',
    description: 'Express passion for photography, cooking, gardening, and work-life balance.',
    words: [
      { word: 'photography', meaning: 'Taking photos' },
      { word: 'gardening', meaning: 'Plant care' },
      { word: 'cooking', meaning: 'Culinary arts' }
    ],
    timeEstimate: '10 mins',
    bgGradient: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)'
  },
  {
    slug: 'technology',
    title: 'Technology & Digital Era',
    titleVi: 'Công nghệ, đổi mới & kết nối số',
    level: 'B1',
    levelColor: 'b1',
    icon: 'tech',
    materialIcon: 'smart_toy',
    description: 'Discuss technological innovation, remote collaboration, accessibility, and AI revolution.',
    words: [
      { word: 'innovation', meaning: 'Groundbreaking' },
      { word: 'collaboration', meaning: 'Teamwork' },
      { word: 'accessible', meaning: 'Easy to reach' },
      { word: 'revolutionize', meaning: 'Transform' }
    ],
    timeEstimate: '12 mins',
    bgGradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)'
  },
  {
    slug: 'environment',
    title: 'Environment & Sustainability',
    titleVi: 'Môi trường, sinh thái & phát triển bền vững',
    level: 'B2',
    levelColor: 'b2',
    icon: 'nature',
    materialIcon: 'eco',
    description: 'Discuss biodiversity, climate action, fragile ecosystems, and sustainable development.',
    words: [
      { word: 'sustainable', meaning: 'Eco-friendly' },
      { word: 'biodiversity', meaning: 'Biological variety' },
      { word: 'ecosystem', meaning: 'Living network' }
    ],
    timeEstimate: '10 mins',
    bgGradient: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)'
  }
]

export default function Explore() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [selectedLevel, setSelectedLevel] = useState('ALL')
  const [statusTab, setStatusTab] = useState('all') // 'all' | 'completed'
  const [searchQuery, setSearchQuery] = useState('')
  const [topicSets, setTopicSets] = useState(fallbackTopicSets)
  const [completedSlugs, setCompletedSlugs] = useState(new Set())
  const [completedCounts, setCompletedCounts] = useState({})

  useEffect(() => {
    let isMounted = true

    async function loadExploreData() {
      try {
        const [setsRes, historyRes] = await Promise.allSettled([
          api.get('/learning-sets'),
          api.get('/sessions/history'),
        ])

        if (!isMounted) return

        // 1. Process completed sessions
        const completed = new Set()
        const countMap = {}
        if (historyRes.status === 'fulfilled') {
          const historyData = historyRes.value?.data?.data || historyRes.value?.data
          if (historyData?.completedSlugCounts && Object.keys(historyData.completedSlugCounts).length > 0) {
            Object.entries(historyData.completedSlugCounts).forEach(([slug, count]) => {
              completed.add(slug)
              countMap[slug] = count
            })
          } else {
            const sessions = historyData?.recentSessions || []
            for (const s of sessions) {
              if (s.learningSetSlug) {
                completed.add(s.learningSetSlug)
                countMap[s.learningSetSlug] = (countMap[s.learningSetSlug] || 0) + 1
              }
            }
          }
        }
        setCompletedSlugs(completed)
        setCompletedCounts(countMap)

        // 2. Process published learning sets from server
        if (setsRes.status === 'fulfilled') {
          const serverData = setsRes.value?.data
          const rawSets = Array.isArray(serverData)
            ? serverData
            : Array.isArray(serverData?.data)
              ? serverData.data
              : []

          if (rawSets.length > 0) {
            const merged = rawSets.map((srv) => {
              const preset = fallbackTopicSets.find((p) => p.slug === srv.slug) || {}
              const items = (srv.items || []).map((item) => ({
                word: item.word,
                meaning: item.definitionVi || item.meaningVi || preset.words?.find((w) => w.word === item.word)?.meaning || 'Vocabulary target',
              }))

              return {
                slug: srv.slug,
                title: srv.title || preset.title || srv.slug,
                titleVi: preset.titleVi || srv.category || srv.title,
                level: srv.level || preset.level || 'B1',
                levelColor: (srv.level || preset.level || 'B1').toLowerCase(),
                materialIcon: preset.materialIcon || 'school',
                description: srv.description || preset.description || '',
                words: items.length > 0 ? items : (preset.words || []),
                timeEstimate: preset.timeEstimate || '10 mins',
                bgGradient: preset.bgGradient || 'linear-gradient(135deg, #005bbf 0%, #1a73e8 100%)',
              }
            })
            setTopicSets(merged)
          }
        }
      } catch (err) {
        console.error('Error fetching explore learning sets:', err)
      }
    }

    loadExploreData()
    return () => {
      isMounted = false
    }
  }, [])

  const processedSets = topicSets.map((topic) => {
    const isCompleted = completedSlugs.has(topic.slug)
    if (statusTab === 'all' && isCompleted) {
      // In "All Progress" view, completed topics generate the next round of vocabulary
      const completedCount = completedCounts[topic.slug] || 1
      const totalRounds = TOPIC_VOCABULARY_ROUNDS[topic.slug]?.length || 3
      const nextRoundNumber = (completedCount % totalRounds) + 1
      const roundData = getTopicRound(topic.slug, nextRoundNumber)
      if (roundData && roundData.words?.length) {
        const newWords = roundData.words.map((w) => ({
          word: w.word,
          meaning: w.meaningVi || w.meaning || '',
        }))
        return {
          ...topic,
          isCompleted: true,
          isNewRound: true,
          roundNumber: nextRoundNumber,
          displayWords: newWords,
          displayDesc: roundData.promptTopic || topic.description,
        }
      }
    }
    return {
      ...topic,
      isCompleted,
      isNewRound: false,
      roundNumber: 1,
      displayWords: topic.words,
      displayDesc: topic.description,
    }
  })

  const filteredSets = processedSets.filter((set) => {
    if (statusTab === 'completed' && !set.isCompleted) {
      return false
    }
    const matchesLevel = selectedLevel === 'ALL' || set.level === selectedLevel
    const q = searchQuery.toLowerCase().trim()
    if (!q) return matchesLevel

    const matchesSearch =
      set.title.toLowerCase().includes(q) ||
      set.titleVi.toLowerCase().includes(q) ||
      set.displayWords.some((w) => w.word.toLowerCase().includes(q) || (w.meaning && w.meaning.toLowerCase().includes(q))) ||
      set.words.some((w) => w.word.toLowerCase().includes(q))
    return matchesLevel && matchesSearch
  })

  return (
    <div className="explore animate-fade-in">
      {/* Header & Filter Bar */}
      <section className="explore__hero">
        <div className="explore__hero-left">
          <div className="explore__badge">
            <span className="material-symbols-outlined">explore</span>
            {t('explore.badge', 'Thematic Vocabulary Sets Library')}
          </div>
          <h2 className="explore__title">{t('explore.title', 'Explore Target Vocabulary Sets')}</h2>
          <p className="explore__desc">
            {t('explore.desc', 'Pick your favorite topic to start a 10-minute learning loop: Explore Words ➔ Quick Quiz ➔ Smart Writing ➔ Detailed AI Feedback.')}
          </p>
        </div>

        <div className="explore__search-bar">
          <span className="material-symbols-outlined explore__search-icon">search</span>
          <input
            type="text"
            className="explore__search-input"
            placeholder={t('explore.searchPlaceholder', 'Search by topic or vocabulary word...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* Level Filters & Status Tabs */}
      <div className="explore__filter-row">
        <div className="explore__filter-left">
          <span className="explore__filter-label">{t('explore.filterLabel', 'Filter by proficiency:')}</span>
          <div className="explore__level-buttons">
            {['ALL', 'A2', 'B1', 'B2'].map((lvl) => (
              <button
                key={lvl}
                className={`explore__lvl-btn ${selectedLevel === lvl ? 'explore__lvl-btn--active' : ''}`}
                onClick={() => setSelectedLevel(lvl)}
              >
                {lvl === 'ALL' ? t('explore.allLevels', 'All Levels') : `${t('explore.level', 'Level')} ${lvl}`}
              </button>
            ))}
          </div>
        </div>

        <div className="explore__filter-right">
          <div className="explore__status-tabs">
            <button
              type="button"
              className={`explore__status-tab-btn ${statusTab === 'all' ? 'explore__status-tab-btn--active' : ''}`}
              onClick={() => setStatusTab('all')}
            >
              <span className="material-symbols-outlined">grid_view</span>
              {t('explore.allProgressTab', 'Tất cả tiến độ')}
            </button>
            <button
              type="button"
              className={`explore__status-tab-btn explore__status-tab-btn--completed ${statusTab === 'completed' ? 'explore__status-tab-btn--active' : ''}`}
              onClick={() => setStatusTab('completed')}
            >
              <span className="material-symbols-outlined">task_alt</span>
              {t('explore.completedTab', 'Đã hoàn thành')}
              {completedSlugs.size > 0 && (
                <span className="explore__completed-counter">{completedSlugs.size}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Topic Cards Grid or Empty State */}
      {filteredSets.length === 0 ? (
        <div className="explore__empty-state card-base">
          <div className="explore__empty-icon">
            <span className="material-symbols-outlined">
              {statusTab === 'completed' ? 'task_alt' : 'sentiment_dissatisfied'}
            </span>
          </div>
          <h3 className="explore__empty-title">
            {statusTab === 'completed'
              ? t('explore.noCompletedTitle', 'Chưa có chủ đề nào hoàn thành')
              : t('explore.noResultsTitle', 'Không tìm thấy bộ từ vựng phù hợp')}
          </h3>
          <p className="explore__empty-desc">
            {statusTab === 'completed'
              ? t('explore.noCompletedDesc', 'Hãy chọn một chủ đề trong tab Tất cả tiến độ để bắt đầu học và tích lũy từ vựng!')
              : t('explore.noResultsDesc', 'Hãy thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc trình độ.')}
          </p>
          {statusTab === 'completed' && (
            <button
              type="button"
              className="btn-primary explore__empty-action"
              onClick={() => {
                setStatusTab('all')
                setSelectedLevel('ALL')
              }}
            >
              <span className="material-symbols-outlined">explore</span>
              {t('explore.allProgressTab', 'Tất cả tiến độ')}
            </button>
          )}
        </div>
      ) : (
        <section className="explore__grid">
          {filteredSets.map((topic) => {
            const isCompletedView = statusTab === 'completed'

            return (
              <article
                key={topic.slug}
                className={`topic-card card-base ${isCompletedView ? 'topic-card--completed' : ''} ${topic.isNewRound ? 'topic-card--new-round' : ''}`}
              >
                <div className="topic-card__header">
                  <div className="topic-card__icon-box">
                    <span className="material-symbols-outlined">{topic.materialIcon}</span>
                  </div>
                  <div className="topic-card__header-meta">
                    {isCompletedView ? (
                      <span className="topic-card__badge--completed">
                        <span className="material-symbols-outlined">check_circle</span>
                        {t('explore.completed', 'Đã hoàn thành')}
                      </span>
                    ) : topic.isNewRound ? (
                      <span className="topic-card__badge--new-round">
                        <span className="material-symbols-outlined">auto_awesome</span>
                        {t('explore.newWordsBadge', 'Bộ từ mới')} • {t('explore.roundLabel', 'Vòng')} {topic.roundNumber}
                      </span>
                    ) : null}
                    <span className={`topic-card__level-badge topic-card__level-badge--${topic.levelColor}`}>
                      {topic.level}
                    </span>
                    <span className="topic-card__time">
                      <span className="material-symbols-outlined">schedule</span>
                      {topic.timeEstimate}
                    </span>
                  </div>
                </div>

                <div className="topic-card__content">
                  <h3 className="topic-card__title">{topic.title}</h3>
                  <h4 className="topic-card__sub">{topic.titleVi}</h4>
                  <p className="topic-card__desc">{topic.displayDesc}</p>
                </div>

                {/* Target Words Preview */}
                <div className="topic-card__words">
                  <span className="topic-card__words-label">
                    {topic.displayWords.length} {t('explore.targetWordsLabel', 'Từ vựng mục tiêu')}:
                  </span>
                  <div className="topic-card__chips">
                    {topic.displayWords.map((w) => (
                      <span key={w.word} className="topic-card__word-chip">
                        <strong>{w.word}</strong>
                        {w.meaning && <span className="topic-card__word-meaning">({w.meaning})</span>}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="topic-card__footer">
                  {isCompletedView ? (
                    <button
                      className="btn-secondary topic-card__start-btn topic-card__start-btn--completed"
                      onClick={() => navigate(`/student/writing?set=${topic.slug}&force=true`)}
                    >
                      <span className="material-symbols-outlined">restart_alt</span>
                      {t('explore.reviewSession', 'Luyện tập lại')} ({topic.timeEstimate})
                    </button>
                  ) : topic.isNewRound ? (
                    <button
                      className="btn-primary topic-card__start-btn topic-card__start-btn--new-round"
                      onClick={() => navigate(`/student/writing?set=${topic.slug}&round=${topic.roundNumber}&advanceTopic=true`)}
                    >
                      <span className="material-symbols-outlined">play_circle</span>
                      {t('explore.startSession', 'Bắt đầu học')} ({topic.timeEstimate})
                    </button>
                  ) : (
                    <button
                      className="btn-primary topic-card__start-btn"
                      onClick={() => navigate(`/student/writing?set=${topic.slug}`)}
                    >
                      <span className="material-symbols-outlined">play_circle</span>
                      {t('explore.startSession', 'Bắt đầu học')} ({topic.timeEstimate})
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </section>
      )}
    </div>
  )
}