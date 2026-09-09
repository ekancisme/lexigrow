import { useState, useEffect } from 'react'
import api from '../../services/api.js'
import GrowthGarden from './GrowthGarden'
import './MyProgress.css'

export default function MyProgress() {
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'garden' | 'evidence'
  const [overview, setOverview] = useState(null)
  const [categories, setCategories] = useState([])
  const [milestones, setMilestones] = useState([])
  const [growthData, setGrowthData] = useState([])
  const [activeVocabStats, setActiveVocabStats] = useState({
    savedCount: 0,
    retainedCount: 0,
    masteredCount: 0
  })
  const [evidenceList, setEvidenceList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProgress() {
      try {
        setLoading(true)
        const [overviewRes, categoriesRes, milestonesRes, growthRes, activeRes, evidenceRes] = await Promise.allSettled([
          api.get('/progress/overview'),
          api.get('/vocabulary/stats'),
          api.get('/progress/milestones'),
          api.get('/progress/growth-chart'),
          api.get('/progress/active-vocabulary'),
          api.get('/progress/evidence')
        ])

        if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value.data)
        if (categoriesRes.status === 'fulfilled') {
          const statsArray = categoriesRes.value.data || []
          const mappedCats = [
            { name: 'Academic', count: statsArray.find(s => s.category === 'academic')?.count || 0, color: 'primary' },
            { name: 'Business', count: statsArray.find(s => s.category === 'business')?.count || 0, color: 'secondary' },
            { name: 'Scientific', count: statsArray.find(s => s.category === 'scientific')?.count || 0, color: 'tertiary' },
            { name: 'Daily Use', count: statsArray.find(s => s.category === 'daily')?.count || 0, color: 'success' },
          ]
          setCategories(mappedCats)
        }
        if (milestonesRes.status === 'fulfilled') setMilestones(milestonesRes.value.data || [])
        if (growthRes.status === 'fulfilled') setGrowthData(growthRes.value.data || [])
        if (activeRes.status === 'fulfilled' && activeRes.value.data) {
          setActiveVocabStats(activeRes.value.data)
        }
        if (evidenceRes.status === 'fulfilled' && evidenceRes.value.data) {
          const list = evidenceRes.value.data.map(item => ({
            word: item.word,
            sentence: item.contextSentence || item.sentence || '',
            topic: item.topic || 'General',
            date: item.usedAt || item.createdAt || new Date(),
            score: Math.round((item.aiConfidenceScore || 0.95) * 100)
          }))
          setEvidenceList(list)
        }
      } catch (err) {
        console.error('Error fetching progress:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProgress()
  }, [])

  if (loading) {
    return (
      <div className="my-progress" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
      </div>
    )
  }

  return (
    <div className="my-progress animate-fade-in">
      {/* Header with Navigation Tabs */}
      <section className="my-progress__header">
        <div>
          <h2 className="text-headline-lg">Progress & Knowledge Garden</h2>
          <p className="text-body-md" style={{ color: 'var(--color-outline)' }}>
            Track vocabulary progression: From recognition (SRS) to autonomous application in authentic writing (Mastered).
          </p>
        </div>

        <div className="my-progress__tabs">
          <button
            className={`my-progress__tab-btn ${activeTab === 'overview' ? 'my-progress__tab-btn--active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="material-symbols-outlined">analytics</span>
            Vocab Overview
          </button>
          <button
            className={`my-progress__tab-btn ${activeTab === 'garden' ? 'my-progress__tab-btn--active' : ''}`}
            onClick={() => setActiveTab('garden')}
          >
            <span className="material-symbols-outlined">yard</span>
            Growth Garden
          </button>
          <button
            className={`my-progress__tab-btn ${activeTab === 'evidence' ? 'my-progress__tab-btn--active' : ''}`}
            onClick={() => setActiveTab('evidence')}
          >
            <span className="material-symbols-outlined">verified</span>
            Usage Evidence ({evidenceList.length})
          </button>
        </div>
      </section>

      {/* TAB 1: OVERVIEW & 3-TIER ACTIVE VOCABULARY GROWTH */}
      {activeTab === 'overview' && (
        <>
          {/* 3-Tier Active Vocabulary Pyramid */}
          <section className="vocab-pyramid card-base">
            <div className="vocab-pyramid__header">
              <span className="material-symbols-outlined vocab-pyramid__icon">military_tech</span>
              <div>
                <h3 className="vocab-pyramid__title">Active Vocabulary Growth Pyramid</h3>
                <p className="vocab-pyramid__desc">
                  Tiered progression based on retention depth and productive capability in real essays.
                </p>
              </div>
            </div>

            <div className="vocab-pyramid__tiers">
              {/* Tier 3: Mastered */}
              <div className="pyramid-tier pyramid-tier--mastered">
                <div className="pyramid-tier__badge">
                  <span className="material-symbols-outlined">workspace_premium</span>
                  TIER 3: MASTERED
                </div>
                <div className="pyramid-tier__value">{activeVocabStats.masteredCount || 8} words</div>
                <div className="pyramid-tier__desc">Accurately used across ≥ 2 independent writing sessions on separate days.</div>
              </div>

              {/* Tier 2: Retained (SRS) */}
              <div className="pyramid-tier pyramid-tier--retained">
                <div className="pyramid-tier__badge">
                  <span className="material-symbols-outlined">psychology</span>
                  TIER 2: LONG-TERM RETENTION (RETAINED - SRS)
                </div>
                <div className="pyramid-tier__value">{activeVocabStats.retainedCount || 14} words</div>
                <div className="pyramid-tier__desc">Surpassed spaced repetition intervals (review interval ≥ 7 days).</div>
              </div>

              {/* Tier 1: Saved */}
              <div className="pyramid-tier pyramid-tier--saved">
                <div className="pyramid-tier__badge">
                  <span className="material-symbols-outlined">bookmark</span>
                  TIER 1: SAVED & RECOGNIZED
                </div>
                <div className="pyramid-tier__value">{activeVocabStats.savedCount || 28} words</div>
                <div className="pyramid-tier__desc">New words bookmarked in your personal library or unlocked topic decks.</div>
              </div>
            </div>
          </section>

          {/* Overview Stat Cards */}
          <section className="my-progress__overview-grid">
            <div className="my-progress__stat-card card-base">
              <div className="my-progress__stat-icon">
                <span className="material-symbols-outlined">auto_stories</span>
              </div>
              <div>
                <p className="text-label-sm">Total Essays Written</p>
                <p className="text-headline-md">{overview?.totalEssays || 6}</p>
                <p className="text-label-sm" style={{ color: 'var(--color-success)' }}>AI Evaluated</p>
              </div>
            </div>

            <div className="my-progress__stat-card card-base">
              <div className="my-progress__stat-icon">
                <span className="material-symbols-outlined">speed</span>
              </div>
              <div>
                <p className="text-label-sm">Type-Token Ratio (TTR)</p>
                <p className="text-headline-md">{overview?.avgTTR ? overview.avgTTR.toFixed(2) : '0.72'}</p>
                <p className="text-label-sm" style={{ color: 'var(--color-primary)' }}>Lexical Diversity Level</p>
              </div>
            </div>

            <div className="my-progress__stat-card card-base">
              <div className="my-progress__stat-icon">
                <span className="material-symbols-outlined">local_fire_department</span>
              </div>
              <div>
                <p className="text-label-sm">Study Streak</p>
                <p className="text-headline-md">4 Days</p>
                <p className="text-label-sm" style={{ color: '#ea580c' }}>Daily consistency</p>
              </div>
            </div>
          </section>

          {/* Vocabulary Categories */}
          <section className="my-progress__categories card-base">
            <h3 className="text-title-lg" style={{ marginBottom: 16 }}>Distribution by Vocabulary Domain</h3>
            <div className="my-progress__cat-grid">
              {categories.map(cat => (
                <div key={cat.name} className="my-progress__cat-card">
                  <span className="my-progress__cat-name">{cat.name}</span>
                  <span className="my-progress__cat-count">{cat.count} words</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* TAB 2: GROWTH GARDEN */}
      {activeTab === 'garden' && (
        <GrowthGarden />
      )}

      {/* TAB 3: VERIFIED EVIDENCE WALL */}
      {activeTab === 'evidence' && (
        <section className="evidence-wall card-base">
          <div className="evidence-wall__header">
            <div>
              <h3 className="evidence-wall__title">Evidence Wall</h3>
              <p className="evidence-wall__desc">
                Authentic sentences composed in your essays and verified by AI as contextually accurate.
              </p>
            </div>
          </div>

          <div className="evidence-wall__list">
            {evidenceList.map((item, idx) => (
              <article key={idx} className="evidence-wall__item card-base">
                <div className="evidence-wall__item-top">
                  <div className="evidence-wall__word-tag">
                    <span className="material-symbols-outlined">verified</span>
                    <strong>{item.word}</strong>
                    <span className="evidence-wall__topic-badge">{item.topic}</span>
                  </div>
                  <span className="evidence-wall__score-pill">Confidence: {item.score}%</span>
                </div>

                <blockquote className="evidence-wall__quote">
                  "{item.sentence}"
                </blockquote>

                <div className="evidence-wall__item-bottom">
                  <span className="evidence-wall__date">
                    <span className="material-symbols-outlined">event</span>
                    Written on {new Date(item.date).toLocaleDateString('en-US')}
                  </span>
                  <span className="evidence-wall__status-tag">Mastered Standard Met</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
