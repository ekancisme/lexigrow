import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Explore.css'

const exploreTopicSets = [
  {
    slug: 'daily-life',
    title: 'Daily Life & Routines',
    titleVi: 'Đời sống thường nhật & Thói quen',
    level: 'A2',
    levelColor: 'a2',
    icon: 'routine',
    materialIcon: 'wb_sunny',
    description: 'Học cách diễn đạt các hoạt động sinh hoạt, đi lại và mua sắm trong đời sống thường ngày.',
    words: [
      { word: 'routine', meaning: 'Thói quen' },
      { word: 'commute', meaning: 'Đi làm/đi học' },
      { word: 'grocery', meaning: 'Đồ tạp hóa' }
    ],
    timeEstimate: '10 phút',
    bgGradient: 'linear-gradient(135deg, #005bbf 0%, #1a73e8 100%)'
  },
  {
    slug: 'travel',
    title: 'Travel & Exploration',
    titleVi: 'Du lịch & Trải nghiệm văn hóa',
    level: 'B1',
    levelColor: 'b1',
    icon: 'travel',
    materialIcon: 'flight_takeoff',
    description: 'Miêu tả địa danh nổi tiếng, lịch trình chuyến đi và đặt phòng khách sạn lưu trú.',
    words: [
      { word: 'itinerary', meaning: 'Lịch trình' },
      { word: 'accommodation', meaning: 'Chỗ ở' },
      { word: 'landmark', meaning: 'Địa danh' }
    ],
    timeEstimate: '10 phút',
    bgGradient: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)'
  },
  {
    slug: 'hobbies',
    title: 'Hobbies & Creative Arts',
    titleVi: 'Sở thích & Nghệ thuật sáng tạo',
    level: 'B1',
    levelColor: 'b1',
    icon: 'hobbies',
    materialIcon: 'palette',
    description: 'Chia sẻ niềm đam mê nhiếp ảnh, nấu ăn, làm vườn và cân bằng cuộc sống sau giờ học/làm.',
    words: [
      { word: 'photography', meaning: 'Nhiếp ảnh' },
      { word: 'gardening', meaning: 'Làm vườn' },
      { word: 'cooking', meaning: 'Nấu ăn' }
    ],
    timeEstimate: '10 phút',
    bgGradient: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)'
  },
  {
    slug: 'technology',
    title: 'Technology & Digital Future',
    titleVi: 'Công nghệ & Tương lai số',
    level: 'B2',
    levelColor: 'b2',
    icon: 'tech',
    materialIcon: 'smart_toy',
    description: 'Bàn luận về thuật toán AI, trí tuệ nhân tạo và các đột phá công nghệ mới.',
    words: [
      { word: 'algorithm', meaning: 'Thuật toán' },
      { word: 'automation', meaning: 'Tự động hóa' },
      { word: 'breakthrough', meaning: 'Đột phá' }
    ],
    timeEstimate: '12 phút',
    bgGradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)'
  },
  {
    slug: 'business',
    title: 'Business & Global Economy',
    titleVi: 'Kinh doanh & Kinh tế toàn cầu',
    level: 'B2',
    levelColor: 'b2',
    icon: 'business',
    materialIcon: 'trending_up',
    description: 'Vận dụng từ vựng đàm phán, tăng trưởng doanh thu và chiến lược tiếp thị thị trường.',
    words: [
      { word: 'revenue', meaning: 'Doanh thu' },
      { word: 'negotiation', meaning: 'Đàm phán' },
      { word: 'strategy', meaning: 'Chiến lược' }
    ],
    timeEstimate: '12 phút',
    bgGradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)'
  },
  {
    slug: 'environment',
    title: 'Environment & Sustainability',
    titleVi: 'Môi trường & Phát triển bền vững',
    level: 'B1',
    levelColor: 'b1',
    icon: 'nature',
    materialIcon: 'eco',
    description: 'Thảo luận về biến đổi khí hậu, bảo vệ hệ sinh thái và năng lượng tái tạo.',
    words: [
      { word: 'ecosystem', meaning: 'Hệ sinh thái' },
      { word: 'renewable', meaning: 'Tái tạo' },
      { word: 'conservation', meaning: 'Bảo tồn' }
    ],
    timeEstimate: '10 phút',
    bgGradient: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)'
  }
]

export default function Explore() {
  const navigate = useNavigate()
  const [selectedLevel, setSelectedLevel] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSets = exploreTopicSets.filter(set => {
    const matchesLevel = selectedLevel === 'ALL' || set.level === selectedLevel
    const matchesSearch = set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      set.titleVi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      set.words.some(w => w.word.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesLevel && matchesSearch
  })

  return (
    <div className="explore animate-fade-in">
      {/* Header & Filter Bar */}
      <section className="explore__hero card-base">
        <div className="explore__hero-left">
          <div className="explore__badge">
            <span className="material-symbols-outlined">explore</span>
            Thư viện Bộ Từ Vựng Theo Chủ Đề
          </div>
          <h2 className="explore__title">Khám Phá Các Bộ Từ Vựng Mục Tiêu</h2>
          <p className="explore__desc">
            Chọn chủ đề bạn yêu thích để bắt đầu chuỗi học tập 10 phút: Học từ ➔ Luyện trắc nghiệm ➔ Viết đoạn văn ➔ Nhận AI chấm chữa chi tiết.
          </p>
        </div>

        <div className="explore__search-bar">
          <span className="material-symbols-outlined explore__search-icon">search</span>
          <input
            type="text"
            className="explore__search-input"
            placeholder="Tìm theo chủ đề, từ vựng..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* Level Filters */}
      <div className="explore__filter-row">
        <span className="explore__filter-label">Lọc theo trình độ:</span>
        <div className="explore__level-buttons">
          {['ALL', 'A2', 'B1', 'B2'].map(lvl => (
            <button
              key={lvl}
              className={`explore__lvl-btn ${selectedLevel === lvl ? 'explore__lvl-btn--active' : ''}`}
              onClick={() => setSelectedLevel(lvl)}
            >
              {lvl === 'ALL' ? 'Tất cả trình độ' : `Trình độ ${lvl}`}
            </button>
          ))}
        </div>
      </div>

      {/* Topic Cards Grid */}
      <section className="explore__grid">
        {filteredSets.map(topic => (
          <article key={topic.slug} className="topic-card card-base">
            <div className="topic-card__header">
              <div className="topic-card__icon-box">
                <span className="material-symbols-outlined">{topic.materialIcon}</span>
              </div>
              <div className="topic-card__header-meta">
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
              <p className="topic-card__desc">{topic.description}</p>
            </div>

            {/* Target Words Preview */}
            <div className="topic-card__words">
              <span className="topic-card__words-label">3 từ mục tiêu:</span>
              <div className="topic-card__chips">
                {topic.words.map(w => (
                  <span key={w.word} className="topic-card__word-chip">
                    <strong>{w.word}</strong>
                    <span className="topic-card__word-meaning">({w.meaning})</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="topic-card__footer">
              <button
                className="btn-primary topic-card__start-btn"
                onClick={() => navigate(`/student/writing?set=${topic.slug}`)}
              >
                <span className="material-symbols-outlined">play_circle</span>
                Bắt đầu phiên học (10 phút)
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}