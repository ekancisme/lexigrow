import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../services/api.js'
import './EssayHistory.css'

export default function EssayHistory() {
  const navigate = useNavigate()

  // States
  const [essays, setEssays] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all') // 'all' | 'draft' | 'submitted' | 'reviewed'
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const limit = 10

  useEffect(() => {
    async function fetchEssays() {
      try {
        setLoading(true)
        const statusParam = filterStatus === 'all' ? '' : `&status=${filterStatus}`
        const res = await api.get(`/essays?page=${page}&limit=${limit}${statusParam}`)
        if (res.success) {
          setEssays(res.data || [])
          setTotalPages(res.pages || 1)
          setTotalCount(res.total || 0)
        }
      } catch (err) {
        console.error('Error fetching essays:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchEssays()
  }, [filterStatus, page])

  // Reset page when filter changes
  const handleFilterChange = (status) => {
    setFilterStatus(status)
    setPage(1)
  }

  // Local search filtering
  const filteredEssays = essays.filter(essay =>
    essay.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (essay.theme && essay.theme.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getStatusClass = (status) => {
    switch (status) {
      case 'draft':
        return 'essay-history__status--draft'
      case 'submitted':
        return 'essay-history__status--submitted'
      case 'reviewed':
        return 'essay-history__status--reviewed'
      default:
        return ''
    }
  }

  return (
    <div className="essay-history animate-fade-in">
      {/* Header */}
      <section className="essay-history__header">
        <div>
          <h2 className="text-headline-lg">Essay History</h2>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
            Review all your submitted writing entries and check detailed feedback.
          </p>
        </div>
        <button
          className="essay-history__write-btn"
          onClick={() => navigate('/student/write-essay')}
        >
          <span className="material-symbols-outlined">add</span>
          <span>Write New Essay</span>
        </button>
      </section>

      {/* Toolbar: Filters and Search */}
      <section className="essay-history__toolbar card-base">
        <div className="essay-history__filters">
          {['all', 'draft', 'submitted', 'reviewed'].map((status) => (
            <button
              key={status}
              className={`essay-history__filter-btn ${
                filterStatus === status ? 'essay-history__filter-btn--active' : ''
              }`}
              onClick={() => handleFilterChange(status)}
            >
              {status.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="essay-history__search-wrapper">
          <span className="material-symbols-outlined essay-history__search-icon">search</span>
          <input
            type="text"
            className="essay-history__search-input"
            placeholder="Search essays by title or theme..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      {/* Main Table Card */}
      <section className="essay-history__table-card card-base" style={{ padding: 0 }}>
        {loading ? (
          <div className="essay-history__loading">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            <p>Loading essays...</p>
          </div>
        ) : filteredEssays.length === 0 ? (
          <div className="essay-history__empty">
            <span className="material-symbols-outlined">history_edu</span>
            <h3>No essays found</h3>
            <p>
              {searchTerm
                ? 'Try matching other keywords or clearing the search.'
                : `You don't have any essays under the "${filterStatus}" filter.`}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                className="essay-history__write-btn"
                style={{ marginTop: 'var(--spacing-md)' }}
                onClick={() => navigate('/student/write-essay')}
              >
                Write Your First Essay
              </button>
            )}
          </div>
        ) : (
          <div className="essay-history__table-wrap">
            <table className="essay-history__table">
              <thead>
                <tr>
                  <th className="text-label-sm">DATE</th>
                  <th className="text-label-sm">TITLE</th>
                  <th className="text-label-sm">THEME</th>
                  <th className="text-label-sm">WORDS</th>
                  <th className="text-label-sm">STATUS</th>
                  <th className="text-label-sm">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredEssays.map((essay) => (
                  <tr key={essay._id} onClick={() => {
                    if (essay.status === 'draft') {
                      navigate(`/student/write-essay?id=${essay._id}`)
                    } else {
                      navigate(`/student/feedback?id=${essay._id}`)
                    }
                  }}>
                    <td className="text-body-md essay-history__date">
                      {new Date(essay.submittedAt || essay.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="essay-history__title-cell">
                      <span className="essay-history__essay-title">{essay.title}</span>
                    </td>
                    <td className="text-body-md essay-history__theme">
                      {essay.theme || 'General'}
                    </td>
                    <td className="text-body-md essay-history__words">
                      {essay.wordCount || 0}
                    </td>
                    <td>
                      <span className={`essay-history__status-badge ${getStatusClass(essay.status)}`}>
                        {essay.status.toUpperCase()}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {essay.status === 'draft' ? (
                        <Link to={`/student/write-essay?id=${essay._id}`} className="essay-history__action-link">
                          Edit Draft
                        </Link>
                      ) : (
                        <Link to={`/student/feedback?id=${essay._id}`} className="essay-history__action-link">
                          View Feedback
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Pagination (Only show if totalPages > 1) */}
      {!loading && totalPages > 1 && (
        <section className="essay-history__pagination">
          <button
            className="essay-history__page-btn"
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            <span className="material-symbols-outlined">chevron_left</span>
            <span>Previous</span>
          </button>
          
          <div className="essay-history__page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`essay-history__page-num ${page === p ? 'essay-history__page-num--active' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            className="essay-history__page-btn"
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
          >
            <span>Next</span>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </section>
      )}
    </div>
  )
}
