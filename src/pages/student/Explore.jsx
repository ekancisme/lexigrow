import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Explore.css'

const exploreTopicSets = [
  {
    slug: 'daily-life',
    title: 'Daily Life & Routines',
    titleVi: 'Everyday activities, commuting & errands',
    level: 'A2',
    levelColor: 'a2',
    icon: 'routine',
    materialIcon: 'wb_sunny',
    description: 'Master essential expressions for daily routines, commuting to work/school, and household shopping.',
    words: [
      { word: 'routine', meaning: 'Daily habits' },
      { word: 'commute', meaning: 'Travel to work/school' },
      { word: 'grocery', meaning: 'Food & supplies' }
    ],
    timeEstimate: '10 mins',
    bgGradient: 'linear-gradient(135deg, #005bbf 0%, #1a73e8 100%)'
  },
  {
    slug: 'travel',
    title: 'Travel & Exploration',
    titleVi: 'Culture, trips & accommodations',
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
    titleVi: 'Passions, leisure & balance',
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
    title: 'Technology & Digital Future',
    titleVi: 'AI, computing & breakthroughs',
    level: 'B2',
    levelColor: 'b2',
    icon: 'tech',
    materialIcon: 'smart_toy',
    description: 'Discuss AI algorithms, software automation, and next-generation technological breakthroughs.',
    words: [
      { word: 'algorithm', meaning: 'Logic steps' },
      { word: 'automation', meaning: 'Self-operating' },
      { word: 'breakthrough', meaning: 'Major advance' }
    ],
    timeEstimate: '12 mins',
    bgGradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)'
  },
  {
    slug: 'business',
    title: 'Business & Global Economy',
    titleVi: 'Finance, negotiations & strategy',
    level: 'B2',
    levelColor: 'b2',
    icon: 'business',
    materialIcon: 'trending_up',
    description: 'Apply business vocabulary for financial negotiations, revenue growth, and corporate strategy.',
    words: [
      { word: 'revenue', meaning: 'Income generated' },
      { word: 'negotiation', meaning: 'Deal discussions' },
      { word: 'strategy', meaning: 'Master plan' }
    ],
    timeEstimate: '12 mins',
    bgGradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)'
  },
  {
    slug: 'environment',
    title: 'Environment & Sustainability',
    titleVi: 'Ecology, renewable energy & climate',
    level: 'B1',
    levelColor: 'b1',
    icon: 'nature',
    materialIcon: 'eco',
    description: 'Discuss biodiversity, climate action, ecosystem preservation, and clean renewable energy.',
    words: [
      { word: 'ecosystem', meaning: 'Living network' },
      { word: 'renewable', meaning: 'Sustainable' },
      { word: 'conservation', meaning: 'Protection' }
    ],
    timeEstimate: '10 mins',
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
      <section className="explore__hero">
        <div className="explore__hero-left">
          <div className="explore__badge">
            <span className="material-symbols-outlined">explore</span>
            Thematic Vocabulary Sets Library
          </div>
          <h2 className="explore__title">Explore Target Vocabulary Sets</h2>
          <p className="explore__desc">
            Pick your favorite topic to start a 10-minute learning loop: Explore Words ➔ Quick Quiz ➔ Smart Writing ➔ Detailed AI Feedback.
          </p>
        </div>

        <div className="explore__search-bar">
          <span className="material-symbols-outlined explore__search-icon">search</span>
          <input
            type="text"
            className="explore__search-input"
            placeholder="Search by topic or vocabulary word..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* Level Filters */}
      <div className="explore__filter-row">
        <span className="explore__filter-label">Filter by proficiency:</span>
        <div className="explore__level-buttons">
          {['ALL', 'A2', 'B1', 'B2'].map(lvl => (
            <button
              key={lvl}
              className={`explore__lvl-btn ${selectedLevel === lvl ? 'explore__lvl-btn--active' : ''}`}
              onClick={() => setSelectedLevel(lvl)}
            >
              {lvl === 'ALL' ? 'All Levels' : `Level ${lvl}`}
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
              <span className="topic-card__words-label">3 Target Words:</span>
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
                Start Session ({topic.timeEstimate})
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}