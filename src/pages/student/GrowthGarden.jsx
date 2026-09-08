import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import './GrowthGarden.css'

const initialGardenData = [
  {
    topic: 'Daily Life',
    slug: 'daily-life',
    level: 'A2',
    icon: 'wb_sunny',
    masteredCount: 3,
    totalCount: 3,
    stage: 'blooming', // 'seed' | 'sprout' | 'branch' | 'blooming'
    words: [
      { word: 'routine', status: 'mastered', evidence: 'I try to stick to my daily routine even on weekends.' },
      { word: 'commute', status: 'mastered', evidence: 'It takes me 30 minutes to commute to work by bus.' },
      { word: 'grocery', status: 'mastered', evidence: 'We do our grocery shopping every Sunday afternoon.' }
    ]
  },
  {
    topic: 'Travel & Discovery',
    slug: 'travel',
    level: 'B1',
    icon: 'flight_takeoff',
    masteredCount: 2,
    totalCount: 3,
    stage: 'branch',
    words: [
      { word: 'itinerary', status: 'mastered', evidence: 'Our travel itinerary includes visiting historical museums.' },
      { word: 'accommodation', status: 'mastered', evidence: 'We booked our accommodation near the city center.' },
      { word: 'landmark', status: 'learning', evidence: null }
    ]
  },
  {
    topic: 'Hobbies & Art',
    slug: 'hobbies',
    level: 'B1',
    icon: 'palette',
    masteredCount: 1,
    totalCount: 3,
    stage: 'sprout',
    words: [
      { word: 'photography', status: 'mastered', evidence: 'Photography allows me to capture nature.' },
      { word: 'gardening', status: 'learning', evidence: null },
      { word: 'cooking', status: 'learning', evidence: null }
    ]
  },
  {
    topic: 'Technology & AI',
    slug: 'technology',
    level: 'B2',
    icon: 'smart_toy',
    masteredCount: 0,
    totalCount: 3,
    stage: 'seed',
    words: [
      { word: 'algorithm', status: 'seed', evidence: null },
      { word: 'automation', status: 'seed', evidence: null },
      { word: 'breakthrough', status: 'seed', evidence: null }
    ]
  }
]

export default function GrowthGarden() {
  const navigate = useNavigate()
  const [gardenTopics, setGardenTopics] = useState(initialGardenData)
  const [selectedTopic, setSelectedTopic] = useState(initialGardenData[0])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadGarden() {
      try {
        setLoading(true)
        const res = await api.get('/garden/status')
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const merged = initialGardenData.map(topic => {
            const serverItem = res.data.find(d => 
              (d.theme || d.topic)?.toLowerCase() === topic.topic.toLowerCase() || 
              (d.theme || d.topic)?.toLowerCase() === topic.slug.toLowerCase()
            )
            if (serverItem) {
              return {
                ...topic,
                masteredCount: serverItem.masteredCount !== undefined ? serverItem.masteredCount : topic.masteredCount,
                stage: serverItem.stage || (serverItem.masteredCount >= 3 ? 'blooming' : serverItem.masteredCount >= 2 ? 'branch' : serverItem.masteredCount >= 1 ? 'sprout' : 'seed')
              }
            }
            return topic
          })
          setGardenTopics(merged)
          setSelectedTopic(merged[0])
        }
      } catch {
        // Fallback to initial rich dataset
      } finally {
        setLoading(false)
      }
    }
    loadGarden()
  }, [])

  const totalMastered = gardenTopics.reduce((sum, t) => sum + (t.masteredCount || 0), 0)

  return (
    <div className="growth-garden animate-fade-in">
      {/* Header Banner */}
      <div className="growth-garden__hero">
        <div className="growth-garden__hero-left">
          <div className="growth-garden__badge">
            <span className="material-symbols-outlined">yard</span>
            Khu vườn Từ vựng Sinh thái
          </div>
          <h2 className="growth-garden__title">Cây Tri Thức Của Bạn</h2>
          <p className="growth-garden__desc">
            Mỗi từ vựng được bạn vận dụng thành công trong các bài viết sẽ giúp cây của chủ đề đó đâm chồi, nảy lộc và đơm hoa kết trái.
          </p>
        </div>

        <div className="growth-garden__stats-card">
          <span className="growth-garden__stat-num">{totalMastered}</span>
          <span className="growth-garden__stat-label">Từ đã làm chủ (Mastered)</span>
          <button
            className="btn-primary growth-garden__btn-plant"
            onClick={() => navigate('/student/explore')}
          >
            <span className="material-symbols-outlined">add_circle</span>
            Trồng cây chủ đề mới
          </button>
        </div>
      </div>

      {/* Main Garden Grid */}
      <div className="growth-garden__layout">
        {/* Garden SVG Canvas / Topic Plants */}
        <div className="growth-garden__canvas card-base">
          <h3 className="growth-garden__canvas-title">
            <span className="material-symbols-outlined">forest</span>
            Các nhánh cây chủ đề
          </h3>

          <div className="growth-garden__plants-grid">
            {gardenTopics.map(topic => {
              const isSelected = selectedTopic?.slug === topic.slug
              return (
                <div
                  key={topic.slug}
                  className={`plant-card card-base plant-card--${topic.stage} ${isSelected ? 'plant-card--selected' : ''}`}
                  onClick={() => setSelectedTopic(topic)}
                >
                  <div className="plant-card__icon-wrap">
                    <span className="material-symbols-outlined">{topic.icon}</span>
                  </div>

                  {/* Visual Tree / Stage Illustration */}
                  <div className="plant-card__stage-art">
                    {topic.stage === 'seed' && (
                      <div className="stage-seed">
                        <span className="material-symbols-outlined">grain</span>
                        <span>Hạt giống</span>
                      </div>
                    )}
                    {topic.stage === 'sprout' && (
                      <div className="stage-sprout">
                        <span className="material-symbols-outlined">spa</span>
                        <span>Đang nảy mầm</span>
                      </div>
                    )}
                    {topic.stage === 'branch' && (
                      <div className="stage-branch">
                        <span className="material-symbols-outlined">eco</span>
                        <span>Cành lá xum xuê</span>
                      </div>
                    )}
                    {topic.stage === 'blooming' && (
                      <div className="stage-blooming">
                        <span className="material-symbols-outlined">local_florist</span>
                        <span>Nở hoa rực rỡ</span>
                      </div>
                    )}
                  </div>

                  <h4 className="plant-card__title">{topic.topic}</h4>
                  <div className="plant-card__progress">
                    <div className="plant-card__bar">
                      <div
                        className="plant-card__fill"
                        style={{ width: `${((topic.masteredCount || 0) / (topic.totalCount || 3)) * 100}%` }}
                      />
                    </div>
                    <span className="plant-card__ratio">
                      {topic.masteredCount} / {topic.totalCount} từ
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Topic Detail Drawer */}
        {selectedTopic && (
          <aside className="growth-garden__detail card-base">
            <div className="growth-garden__detail-header">
              <div className="growth-garden__detail-title-row">
                <span className="material-symbols-outlined growth-garden__detail-icon">{selectedTopic.icon}</span>
                <div>
                  <h4 className="growth-garden__detail-title">{selectedTopic.topic}</h4>
                  <span className="growth-garden__detail-sub">Trình độ {selectedTopic.level}</span>
                </div>
              </div>
            </div>

            <div className="growth-garden__detail-words">
              <h5>Danh sách từ vựng & Câu văn thực tế:</h5>
              {selectedTopic.words?.map((w, idx) => (
                <div key={idx} className="evidence-card">
                  <div className="evidence-card__top">
                    <span className="evidence-card__word">{w.word}</span>
                    <span className={`evidence-badge evidence-badge--${w.status}`}>
                      {w.status === 'mastered' ? 'Đã làm chủ (Mastered)' : 'Đang học'}
                    </span>
                  </div>
                  {w.evidence ? (
                    <p className="evidence-card__sentence">"{w.evidence}"</p>
                  ) : (
                    <p className="evidence-card__empty">Chưa có câu văn vận dụng trong bài viết.</p>
                  )}
                </div>
              ))}
            </div>

            <button
              className="btn-primary growth-garden__detail-action"
              onClick={() => navigate(`/student/writing?set=${selectedTopic.slug}`)}
            >
              Luyện viết chủ đề này
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </aside>
        )}
      </div>
    </div>
  )
}
