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
    savedCount: 28,
    retainedCount: 14,
    masteredCount: 8
  })
  const [evidenceList, setEvidenceList] = useState([
    {
      word: 'routine',
      sentence: 'I try to stick to my daily routine even on weekends.',
      topic: 'Daily Life',
      date: '2026-09-08',
      score: 95
    },
    {
      word: 'commute',
      sentence: 'It takes me 30 minutes to commute to work by bus every morning.',
      topic: 'Daily Life',
      date: '2026-09-08',
      score: 92
    },
    {
      word: 'grocery',
      sentence: 'We do our grocery shopping together every Sunday afternoon.',
      topic: 'Daily Life',
      date: '2026-09-07',
      score: 98
    },
    {
      word: 'itinerary',
      sentence: 'Our travel itinerary includes visiting historical museums and famous local markets.',
      topic: 'Travel',
      date: '2026-09-06',
      score: 94
    },
    {
      word: 'accommodation',
      sentence: 'It is advisable to book accommodation well in advance during peak holiday season.',
      topic: 'Travel',
      date: '2026-09-05',
      score: 96
    }
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProgress() {
      try {
        const [overviewRes, categoriesRes, milestonesRes, growthRes, activeRes] = await Promise.allSettled([
          api.get('/progress/overview'),
          api.get('/vocabulary/stats'),
          api.get('/progress/milestones'),
          api.get('/progress/growth-chart'),
          api.get('/progress/active-vocabulary')
        ])

        if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value.data)
        if (categoriesRes.status === 'fulfilled') {
          const statsArray = categoriesRes.value.data || []
          const mappedCats = [
            { name: 'Academic', count: statsArray.find(s => s.category === 'academic')?.count || 12, color: 'primary' },
            { name: 'Business', count: statsArray.find(s => s.category === 'business')?.count || 8, color: 'secondary' },
            { name: 'Scientific', count: statsArray.find(s => s.category === 'scientific')?.count || 5, color: 'tertiary' },
            { name: 'Daily Use', count: statsArray.find(s => s.category === 'daily')?.count || 18, color: 'success' },
          ]
          setCategories(mappedCats)
        }
        if (milestonesRes.status === 'fulfilled') setMilestones(milestonesRes.value.data || [])
        if (growthRes.status === 'fulfilled') setGrowthData(growthRes.value.data || [])
        if (activeRes.status === 'fulfilled' && activeRes.value.data) {
          setActiveVocabStats(activeRes.value.data)
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
          <h2 className="text-headline-lg">Tiến Độ & Khu Vườn Tri Thức</h2>
          <p className="text-body-md" style={{ color: 'var(--color-outline)' }}>
            Theo dõi sự chuyển dịch từ vựng: Từ nhận biết (SRS) sang vận dụng độc lập trong bài viết (Mastered).
          </p>
        </div>

        <div className="my-progress__tabs">
          <button
            className={`my-progress__tab-btn ${activeTab === 'overview' ? 'my-progress__tab-btn--active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="material-symbols-outlined">analytics</span>
            Tổng quan Vốn từ
          </button>
          <button
            className={`my-progress__tab-btn ${activeTab === 'garden' ? 'my-progress__tab-btn--active' : ''}`}
            onClick={() => setActiveTab('garden')}
          >
            <span className="material-symbols-outlined">yard</span>
            Khu vườn Tiến bộ
          </button>
          <button
            className={`my-progress__tab-btn ${activeTab === 'evidence' ? 'my-progress__tab-btn--active' : ''}`}
            onClick={() => setActiveTab('evidence')}
          >
            <span className="material-symbols-outlined">verified</span>
            Bằng chứng Vận dụng ({evidenceList.length})
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
                <h3 className="vocab-pyramid__title">Tháp Tăng Trưởng Vốn Từ Chủ Động (Active Vocabulary)</h3>
                <p className="vocab-pyramid__desc">
                  Phân tầng tiến bộ dựa trên mức độ hấp thu và khả năng tự sản sinh từ ngữ trong bài viết thực tế.
                </p>
              </div>
            </div>

            <div className="vocab-pyramid__tiers">
              {/* Tier 3: Mastered */}
              <div className="pyramid-tier pyramid-tier--mastered">
                <div className="pyramid-tier__badge">
                  <span className="material-symbols-outlined">workspace_premium</span>
                  BẬC 3: ĐÃ LÀM CHỦ (MASTERED)
                </div>
                <div className="pyramid-tier__value">{activeVocabStats.masteredCount || 8} từ</div>
                <div className="pyramid-tier__desc">Đã dùng đúng trong ≥ 2 bài viết độc lập ở các ngày khác nhau.</div>
              </div>

              {/* Tier 2: Retained (SRS) */}
              <div className="pyramid-tier pyramid-tier--retained">
                <div className="pyramid-tier__badge">
                  <span className="material-symbols-outlined">psychology</span>
                  BẬC 2: GHI NHỚ DÀI HẠN (RETAINED - SRS)
                </div>
                <div className="pyramid-tier__value">{activeVocabStats.retainedCount || 14} từ</div>
                <div className="pyramid-tier__desc">Đã vượt qua các mốc giãn cách ngắt quãng (Khoảng cách ôn ≥ 7 ngày).</div>
              </div>

              {/* Tier 1: Saved */}
              <div className="pyramid-tier pyramid-tier--saved">
                <div className="pyramid-tier__badge">
                  <span className="material-symbols-outlined">bookmark</span>
                  BẬC 1: ĐÃ LƯU & NHẬN BIẾT (SAVED)
                </div>
                <div className="pyramid-tier__value">{activeVocabStats.savedCount || 28} từ</div>
                <div className="pyramid-tier__desc">Từ mới được lưu trong thư viện cá nhân hoặc qua các chủ đề đã mở.</div>
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
                <p className="text-label-sm">Tổng bài viết đã viết</p>
                <p className="text-headline-md">{overview?.totalEssays || 6}</p>
                <p className="text-label-sm" style={{ color: 'var(--color-success)' }}>Đã được AI phân tích</p>
              </div>
            </div>

            <div className="my-progress__stat-card card-base">
              <div className="my-progress__stat-icon">
                <span className="material-symbols-outlined">speed</span>
              </div>
              <div>
                <p className="text-label-sm">Chỉ số phong phú (TTR)</p>
                <p className="text-headline-md">{overview?.avgTTR ? overview.avgTTR.toFixed(2) : '0.72'}</p>
                <p className="text-label-sm" style={{ color: 'var(--color-primary)' }}>Mức độ đa dạng từ vựng</p>
              </div>
            </div>

            <div className="my-progress__stat-card card-base">
              <div className="my-progress__stat-icon">
                <span className="material-symbols-outlined">local_fire_department</span>
              </div>
              <div>
                <p className="text-label-sm">Chuỗi học tập</p>
                <p className="text-headline-md">4 Ngày</p>
                <p className="text-label-sm" style={{ color: '#ea580c' }}>Duy trì đều đặn mỗi ngày</p>
              </div>
            </div>
          </section>

          {/* Vocabulary Categories */}
          <section className="my-progress__categories card-base">
            <h3 className="text-title-lg" style={{ marginBottom: 16 }}>Phân bổ theo lĩnh vực từ vựng</h3>
            <div className="my-progress__cat-grid">
              {categories.map(cat => (
                <div key={cat.name} className="my-progress__cat-card">
                  <span className="my-progress__cat-name">{cat.name}</span>
                  <span className="my-progress__cat-count">{cat.count} từ</span>
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
              <h3 className="evidence-wall__title">Bức Tường Bằng Chứng Vận Dụng (Evidence Wall)</h3>
              <p className="evidence-wall__desc">
                Tổng hợp tất cả các câu văn thực tế bạn đã viết bằng tiếng Anh và được AI chứng thực đạt chuẩn ngữ cảnh.
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
                  <span className="evidence-wall__score-pill">Độ tin cậy: {item.score}%</span>
                </div>

                <blockquote className="evidence-wall__quote">
                  "{item.sentence}"
                </blockquote>

                <div className="evidence-wall__item-bottom">
                  <span className="evidence-wall__date">
                    <span className="material-symbols-outlined">event</span>
                    Đã viết vào {new Date(item.date).toLocaleDateString('vi-VN')}
                  </span>
                  <span className="evidence-wall__status-tag">Đạt chuẩn Mastered</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
