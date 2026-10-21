import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import api from '../../services/api.js'
import './Explore.css'

const FIGMA_SEARCH_COURSES = [
  {
    id: 'f-1',
    slug: 'ui-design-beginners',
    image: '/assets/editorial/courses/ui-design.png',
    title: 'Adobe Illustrator Scretch Course',
    titleVi: 'Khóa học Adobe Illustrator từ cơ bản',
    instructor: 'MyCourse Studio',
    desc: 'More than 8yr Experience as Illustrator. Learn how to becoming professional Illustrator Now...',
    descVi: 'Hơn 8 năm kinh nghiệm Illustrator. Học cách trở thành nhà minh họa chuyên nghiệp ngay hôm nay...',
    rating: 5.0,
    reviews: '1.2K',
    price: '$24.92',
    originalPrice: '$32.90',
    category: 'Design',
    duration: '3-5 Hours',
    level: 'Beginner',
    bestSeller: true,
    discount: '20% OFF',
  },
  {
    id: 'f-2',
    slug: 'bootcamp-vue-framework',
    image: '/assets/editorial/courses/mobile-dev.png',
    title: 'Bootcamp Vue.js Web Framework',
    titleVi: 'Bootcamp Vue.js Web Framework toàn diện',
    instructor: 'MyCourse Studio',
    desc: 'Learn how to make web application with Vue.js Framework.',
    descVi: 'Học cách xây dựng ứng dụng web hiện đại với nền tảng Vue.js Framework.',
    rating: 5.0,
    reviews: '1.2K',
    price: '$24.92',
    originalPrice: '$32.90',
    category: 'Programming',
    duration: '3-5 Hours',
    level: 'Beginner',
    bestSeller: true,
    discount: '20% OFF',
  },
  {
    id: 'f-3',
    slug: 'design-fundamentals',
    image: '/assets/editorial/courses/desk-notes.png',
    title: 'Design Fundamentals',
    titleVi: 'Nguyên lý thiết kế đồ họa nền tảng',
    instructor: 'MyCourse Studio',
    desc: 'More than 8yr Experience as Illustrator. Learn how to becoming professional Illustrator Now...',
    descVi: 'Hơn 8 năm kinh nghiệm Illustrator. Học cách làm chủ tư duy thiết kế chuyên nghiệp.',
    rating: 5.0,
    reviews: '1.2K',
    price: '$24.92',
    originalPrice: '$32.90',
    category: 'Design',
    duration: '3-5 Hours',
    level: 'Beginner',
    bestSeller: true,
    discount: '20% OFF',
  },
  {
    id: 'f-4',
    slug: 'make-uber-clone-app',
    image: '/assets/editorial/courses/uber-clone.png',
    title: 'Adobe Illustrator Scretch Course',
    titleVi: 'Khóa học Adobe Illustrator từ cơ bản',
    instructor: 'MyCourse Studio',
    desc: 'More than 8yr Experience as Illustrator. Learn how to becoming professional Illustrator Now...',
    descVi: 'Hơn 8 năm kinh nghiệm Illustrator. Học cách trở thành nhà minh họa chuyên nghiệp.',
    rating: 5.0,
    reviews: '1.2K',
    price: '$24.92',
    originalPrice: '$32.90',
    category: 'Programming',
    duration: '6-12 Hours',
    level: 'Intermediate',
    bestSeller: true,
    discount: '20% OFF',
  },
  {
    id: 'f-5',
    slug: 'vue-js-course-3d',
    image: '/assets/editorial/courses/vue-course.png',
    title: 'Bootcamp Vue.js Web Framework',
    titleVi: 'Bootcamp Vue.js Web Framework',
    instructor: 'MyCourse Studio',
    desc: 'Learn how to make web application with Vue.js Framework.',
    descVi: 'Học cách xây dựng ứng dụng web hiện đại với nền tảng Vue.js Framework.',
    rating: 5.0,
    reviews: '1.2K',
    price: '$24.92',
    originalPrice: '$32.90',
    category: 'Programming',
    duration: '3-5 Hours',
    level: 'Beginner',
    bestSeller: true,
    discount: '20% OFF',
  },
  {
    id: 'f-6',
    slug: 'vue-javascript-kitani',
    image: '/assets/editorial/courses/vue-course.png',
    title: 'Design Fundamentals',
    titleVi: 'Nguyên lý thiết kế giao diện số',
    instructor: 'MyCourse Studio',
    desc: 'More than 8yr Experience as Illustrator. Learn how to becoming professional Illustrator Now...',
    descVi: 'Hơn 8 năm kinh nghiệm Illustrator. Khám phá các tiêu chuẩn thiết kế hiện đại.',
    rating: 5.0,
    reviews: '1.2K',
    price: '$24.92',
    originalPrice: '$32.90',
    category: 'Design',
    duration: '3-5 Hours',
    level: 'Beginner',
    bestSeller: true,
    discount: '20% OFF',
  },
  {
    id: 'f-7',
    slug: 'desk-notes-sketch',
    image: '/assets/editorial/courses/desk-notes.png',
    title: 'Adobe Illustrator Scretch Course',
    titleVi: 'Khóa học Adobe Illustrator từ cơ bản',
    instructor: 'MyCourse Studio',
    desc: 'More than 8yr Experience as Illustrator. Learn how to becoming professional Illustrator Now...',
    descVi: 'Hơn 8 năm kinh nghiệm Illustrator. Học cách trở thành nhà minh họa chuyên nghiệp.',
    rating: 5.0,
    reviews: '1.2K',
    price: '$24.92',
    originalPrice: '$32.90',
    category: 'Design',
    duration: '0-2 Hours',
    level: 'Beginner',
    bestSeller: true,
    discount: '20% OFF',
  },
  {
    id: 'f-8',
    slug: 'dev-bootcamp-green',
    image: '/assets/editorial/courses/mobile-dev.png',
    title: 'Bootcamp Vue.js Web Framework',
    titleVi: 'Bootcamp Vue.js Web Framework',
    instructor: 'MyCourse Studio',
    desc: 'Learn how to make web application with Vue.js Framework.',
    descVi: 'Học cách xây dựng ứng dụng web hiện đại với nền tảng Vue.js Framework.',
    rating: 5.0,
    reviews: '1.2K',
    price: '$24.92',
    originalPrice: '$32.90',
    category: 'Programming',
    duration: '3-5 Hours',
    level: 'Intermediate',
    bestSeller: true,
    discount: '20% OFF',
  },
  {
    id: 'f-9',
    slug: 'ios-13-swift-5',
    image: '/assets/editorial/courses/swift-dev.png',
    title: 'Design Fundamentals',
    titleVi: 'Nguyên lý lập trình & thiết kế iOS',
    instructor: 'MyCourse Studio',
    desc: 'More than 8yr Experience as Illustrator. Learn how to becoming professional Illustrator Now...',
    descVi: 'Hơn 8 năm kinh nghiệm Illustrator. Học cách thiết kế và xây dựng sản phẩm chất lượng cao.',
    rating: 5.0,
    reviews: '1.2K',
    price: '$24.92',
    originalPrice: '$32.90',
    category: 'Programming',
    duration: '6-12 Hours',
    level: 'Beginner',
    bestSeller: true,
    discount: '20% OFF',
  },
  {
    id: 'f-10',
    slug: 'learn-prog-30-days',
    image: '/assets/editorial/courses/website-zero.png',
    title: 'Adobe Illustrator Scretch Course',
    titleVi: 'Khóa học Adobe Illustrator từ cơ bản',
    instructor: 'MyCourse Studio',
    desc: 'More than 8yr Experience as Illustrator. Learn how to becoming professional Illustrator Now...',
    descVi: 'Hơn 8 năm kinh nghiệm Illustrator. Học cách trở thành nhà minh họa chuyên nghiệp.',
    rating: 5.0,
    reviews: '1.2K',
    price: '$24.92',
    originalPrice: '$32.90',
    category: 'Design',
    duration: '3-5 Hours',
    level: 'Beginner',
    bestSeller: true,
    discount: '20% OFF',
  },
  {
    id: 'f-11',
    slug: 'website-zero-hero',
    image: '/assets/editorial/courses/website-zero.png',
    title: 'Bootcamp Vue.js Web Framework',
    titleVi: 'Bootcamp Vue.js Web Framework',
    instructor: 'MyCourse Studio',
    desc: 'Learn how to make web application with Vue.js Framework.',
    descVi: 'Học cách xây dựng ứng dụng web hiện đại với nền tảng Vue.js Framework.',
    rating: 5.0,
    reviews: '1.2K',
    price: '$24.92',
    originalPrice: '$32.90',
    category: 'Programming',
    duration: '3-5 Hours',
    level: 'Beginner',
    bestSeller: true,
    discount: '20% OFF',
  },
  {
    id: 'f-12',
    slug: 'modern-code-laptop',
    image: '/assets/editorial/courses/modern-art.png',
    title: 'Design Fundamentals',
    titleVi: 'Nguyên lý thiết kế giao diện & mỹ thuật hiện đại',
    instructor: 'MyCourse Studio',
    desc: 'More than 8yr Experience as Illustrator. Learn how to becoming professional Illustrator Now...',
    descVi: 'Hơn 8 năm kinh nghiệm Illustrator. Nắm vững tư duy thẩm mỹ và cấu trúc giao diện.',
    rating: 5.0,
    reviews: '1.2K',
    price: '$24.92',
    originalPrice: '$32.90',
    category: 'Design',
    duration: '12+ Hours',
    level: 'Advanced',
    bestSeller: true,
    discount: '20% OFF',
  },
]

export default function Explore() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { language } = useLanguage()

  // Default query matching Figma search frame
  const queryParam = searchParams.get('q') || searchParams.get('query') || ''
  const [searchQuery, setSearchQuery] = useState(queryParam || 'UI Design')

  // Filters state matching Figma Frame 519:5693
  const [selectedRating, setSelectedRating] = useState(4.5)
  const [selectedDuration, setSelectedDuration] = useState('3-5 Hours')
  const [selectedCategory, setSelectedCategory] = useState('Design')
  const [selectedLevel, setSelectedLevel] = useState('Beginner')
  const [sortBy, setSortBy] = useState('popular')
  const [currentPage, setCurrentPage] = useState(1)

  // Collapsible accordion sections
  const [softwareOpen, setSoftwareOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)

  // Real backend learning sets if available
  const [serverCourses, setServerCourses] = useState([])

  useEffect(() => {
    let isMounted = true
    async function loadSets() {
      try {
        const res = await api.get('/learning-sets')
        const data = res?.data
        const raw = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
        if (isMounted && raw.length) {
          setServerCourses(raw)
        }
      } catch {
        // Fallback cleanly to FIGMA_SEARCH_COURSES
      }
    }
    loadSets()
    return () => { isMounted = false }
  }, [])

  // Sync if query param changes
  useEffect(() => {
    if (queryParam) {
      setSearchQuery(queryParam)
      setSelectedCategory('ALL')
    }
  }, [queryParam])

  const handleClearFilters = () => {
    setSelectedRating(0)
    setSelectedDuration('ALL')
    setSelectedCategory('ALL')
    setSelectedLevel('ALL')
    setSearchQuery('')
  }

  // Filtered course results
  const filteredCourses = FIGMA_SEARCH_COURSES.filter((course) => {
    if (selectedRating > 0 && course.rating < selectedRating) return false
    if (selectedDuration !== 'ALL' && course.duration !== selectedDuration) return false
    if (selectedCategory !== 'ALL' && course.category !== selectedCategory) return false
    if (selectedLevel !== 'ALL' && course.level !== selectedLevel) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const match =
        course.title.toLowerCase().includes(q) ||
        course.titleVi.toLowerCase().includes(q) ||
        course.category.toLowerCase().includes(q) ||
        course.desc.toLowerCase().includes(q)
      if (!match) return false
    }
    return true
  })

  // Display count matching Figma ("2,312 results" or dynamic count)
  const resultsCount = searchQuery.toLowerCase().includes('ui design') || selectedCategory === 'Design'
    ? '2,312'
    : filteredCourses.length.toString()

  const activeTerm = searchQuery || (selectedCategory !== 'ALL' ? selectedCategory : 'All Courses')

  return (
    <div className="figma-search-page">
      <div className="figma-search-layout">
        {/* ── Left Sidebar Filter (Figma Frame 519:5693) ── */}
        <aside className="figma-sidebar" aria-label="Filters">
          <div className="figma-sidebar__header">
            <h3>{language === 'vi' ? 'Bộ lọc' : 'Filter'}</h3>
            <button type="button" className="figma-sidebar__clear" onClick={handleClearFilters}>
              {language === 'vi' ? 'Xóa lọc' : 'Clear'}
            </button>
          </div>

          {/* 1. Rating */}
          <div className="figma-sidebar__group">
            <div className="figma-sidebar__group-header">
              <span className="figma-sidebar__group-title">{language === 'vi' ? 'Đánh giá' : 'Rating'}</span>
              <span className="material-symbols-outlined figma-sidebar__chevron">expand_less</span>
            </div>
            <div className="figma-sidebar__options">
              {[
                { val: 4.5, label: '4.5 & up', count: '5.8K', stars: 5 },
                { val: 3.5, label: '3.5 & up', count: '1.2K', stars: 4 },
                { val: 3.0, label: '3.0 & up', count: '867', stars: 3 },
              ].map((r) => (
                <label key={r.val} className="figma-filter-item">
                  <input
                    type="radio"
                    name="filter-rating"
                    checked={selectedRating === r.val}
                    onChange={() => setSelectedRating(selectedRating === r.val ? 0 : r.val)}
                  />
                  <span className="figma-custom-radio" />
                  <span className="figma-sidebar-stars">{'★'.repeat(r.stars)}</span>
                  <span className="figma-sidebar-label">{r.label}</span>
                  <span className="figma-sidebar-count">({r.count})</span>
                </label>
              ))}
            </div>
          </div>

          {/* 2. Video Duration */}
          <div className="figma-sidebar__group">
            <div className="figma-sidebar__group-header">
              <span className="figma-sidebar__group-title">{language === 'vi' ? 'Thời lượng video' : 'Video Duration'}</span>
              <span className="material-symbols-outlined figma-sidebar__chevron">expand_less</span>
            </div>
            <div className="figma-sidebar__options">
              {[
                { id: '0-2 Hours', label: '0-2 Hours', count: '9.4K' },
                { id: '3-5 Hours', label: '3-5 Hours', count: '4.1K' },
                { id: '6-12 Hours', label: '6-12 Hours', count: '3.8K' },
                { id: '12+ Hours', label: '12+ Hours', count: '1K' },
              ].map((dur) => (
                <label key={dur.id} className="figma-filter-item">
                  <input
                    type="checkbox"
                    checked={selectedDuration === dur.id}
                    onChange={() => setSelectedDuration(selectedDuration === dur.id ? 'ALL' : dur.id)}
                  />
                  <span className="figma-custom-control" />
                  <span className="figma-sidebar-label">{dur.label}</span>
                  <span className="figma-sidebar-count">({dur.count})</span>
                </label>
              ))}
            </div>
          </div>

          {/* 3. Categories */}
          <div className="figma-sidebar__group">
            <div className="figma-sidebar__group-header">
              <span className="figma-sidebar__group-title">{language === 'vi' ? 'Chuyên mục' : 'Categories'}</span>
              <span className="material-symbols-outlined figma-sidebar__chevron">expand_less</span>
            </div>
            <div className="figma-sidebar__options">
              {[
                { id: 'Design', label: 'Design', count: '3.2K' },
                { id: 'Programming', label: 'Programming', count: '1.4K' },
                { id: 'Business & Marketing', label: 'Business & Marketing', count: '809' },
                { id: 'Finance', label: 'Finance', count: '548' },
                { id: 'Music & Film', label: 'Music & Film', count: '1.9K' },
                { id: 'Photo & Video', label: 'Photo & Video', count: '2.3K' },
                { id: 'Writing', label: 'Writing', count: '753' },
              ].map((cat) => (
                <label key={cat.id} className="figma-filter-item">
                  <input
                    type="checkbox"
                    checked={selectedCategory === cat.id}
                    onChange={() => setSelectedCategory(selectedCategory === cat.id ? 'ALL' : cat.id)}
                  />
                  <span className="figma-custom-control" />
                  <span className="figma-sidebar-label">{cat.label}</span>
                  <span className="figma-sidebar-count">({cat.count})</span>
                </label>
              ))}
            </div>
          </div>

          {/* 4. Software Accordion */}
          <div className="figma-sidebar__group">
            <button
              type="button"
              className="figma-sidebar__group-header"
              onClick={() => setSoftwareOpen((prev) => !prev)}
            >
              <span className="figma-sidebar__group-title">Software</span>
              <span className="material-symbols-outlined figma-sidebar__chevron">
                {softwareOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {softwareOpen && (
              <div className="figma-sidebar__options">
                {['Adobe Illustrator', 'Adobe Photoshop', 'Figma', 'Sketch'].map((sw) => (
                  <label key={sw} className="figma-filter-item">
                    <input type="checkbox" />
                    <span className="figma-custom-control" />
                    <span className="figma-sidebar-label">{sw}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 5. Level */}
          <div className="figma-sidebar__group">
            <div className="figma-sidebar__group-header">
              <span className="figma-sidebar__group-title">{language === 'vi' ? 'Trình độ' : 'Level'}</span>
              <span className="material-symbols-outlined figma-sidebar__chevron">expand_less</span>
            </div>
            <div className="figma-sidebar__options">
              {[
                { id: 'ALL', label: 'All Levels' },
                { id: 'Beginner', label: 'Beginner' },
                { id: 'Intermediate', label: 'Intermediate' },
                { id: 'Advanced', label: 'Advanced' },
              ].map((lvl) => (
                <label key={lvl.id} className="figma-filter-item">
                  <input
                    type="radio"
                    name="filter-level"
                    checked={selectedLevel === lvl.id}
                    onChange={() => setSelectedLevel(lvl.id)}
                  />
                  <span className="figma-custom-radio" />
                  <span className="figma-sidebar-label">{lvl.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 6. Language Accordion */}
          <div className="figma-sidebar__group">
            <button
              type="button"
              className="figma-sidebar__group-header"
              onClick={() => setLanguageOpen((prev) => !prev)}
            >
              <span className="figma-sidebar__group-title">{language === 'vi' ? 'Ngôn ngữ' : 'Language'}</span>
              <span className="material-symbols-outlined figma-sidebar__chevron">
                {languageOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {languageOpen && (
              <div className="figma-sidebar__options">
                {['English', 'Vietnamese', 'French', 'Japanese'].map((lng) => (
                  <label key={lng} className="figma-filter-item">
                    <input type="checkbox" />
                    <span className="figma-custom-control" />
                    <span className="figma-sidebar-label">{lng}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ── Main Content: Results & 3-Col Grid ── */}
        <main className="figma-content">
          <div className="figma-results-header">
            <div className="figma-results-count">
              <span>Showing {resultsCount} results of </span>
              <strong>{activeTerm}</strong>
            </div>

            <select
              className="figma-sort-dropdown"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort courses"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {/* 3 Columns × 4 Rows Grid (12 Cards) */}
          <div className="figma-search-grid">
            {filteredCourses.map((course) => {
              const targetUrl = `/student/writing?set=${course.slug}`
              return (
                <div
                  key={course.id}
                  className="figma-course-card"
                  onClick={() => navigate(targetUrl)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(targetUrl) }}
                >
                  <div className="figma-course-card__thumb-wrap">
                    <img src={course.image} alt={course.title} className="figma-course-card__thumb" />
                    <div className="figma-course-card__badges">
                      {course.bestSeller && (
                        <span className="figma-badge figma-badge--bestseller">Best Seller</span>
                      )}
                      {course.discount && (
                        <span className="figma-badge figma-badge--discount">{course.discount}</span>
                      )}
                    </div>
                  </div>

                  <div className="figma-course-card__body">
                    <h3 className="figma-course-card__title">
                      {language === 'vi' ? course.titleVi : course.title}
                    </h3>

                    <div className="figma-course-card__instructor">
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person</span>
                      <span>{course.instructor}</span>
                    </div>

                    <p className="figma-course-card__desc">
                      {language === 'vi' ? course.descVi : course.desc}
                    </p>

                    <div className="figma-course-card__rating">
                      <div className="figma-stars">{'★'.repeat(5)}</div>
                      <span className="figma-reviews">({course.reviews})</span>
                    </div>

                    <div className="figma-course-card__price-row">
                      <span className="figma-price-current">{course.price}</span>
                      <span className="figma-price-original">{course.originalPrice}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination Controls Matching Figma: < 1 2 3 4 5 ... 98 > */}
          <div className="figma-pagination" aria-label="Pagination">
            <button
              type="button"
              className="figma-page-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
            </button>
            <button
              type="button"
              className={`figma-page-btn ${currentPage === 1 ? 'is-active' : ''}`}
              onClick={() => setCurrentPage(1)}
            >
              1
            </button>
            <button
              type="button"
              className={`figma-page-btn ${currentPage === 2 ? 'is-active' : ''}`}
              onClick={() => setCurrentPage(2)}
            >
              2
            </button>
            <button
              type="button"
              className={`figma-page-btn ${currentPage === 3 ? 'is-active' : ''}`}
              onClick={() => setCurrentPage(3)}
            >
              3
            </button>
            <button
              type="button"
              className={`figma-page-btn ${currentPage === 4 ? 'is-active' : ''}`}
              onClick={() => setCurrentPage(4)}
            >
              4
            </button>
            <button
              type="button"
              className={`figma-page-btn ${currentPage === 5 ? 'is-active' : ''}`}
              onClick={() => setCurrentPage(5)}
            >
              5
            </button>
            <span className="figma-page-dots">…</span>
            <button
              type="button"
              className={`figma-page-btn ${currentPage === 98 ? 'is-active' : ''}`}
              onClick={() => setCurrentPage(98)}
            >
              98
            </button>
            <button
              type="button"
              className="figma-page-btn"
              onClick={() => setCurrentPage((p) => p + 1)}
              aria-label="Next page"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
            </button>
          </div>

          {/* Bottom Dark Discount CTA Banner */}
          <section className="figma-cta-banner">
            <div className="figma-cta-banner__copy">
              <h2>Join Klevr now to get 35% off</h2>
              <p>
                With our responsive themes and mobile and desktop apps, enjoy a seamless
                experience on any device so will your blog the best visitors
              </p>
              <Link to="/register" className="figma-cta-banner__btn">
                <span>Join Klevr</span>
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
