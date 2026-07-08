import { useState, useEffect } from 'react'
import api from '../../services/api'
import './AdminPages.css'

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 })
  
  // Search & filter states
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('')
  const [role, setRole] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)

  async function fetchLogs() {
    setLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        action: action || undefined,
        role: role || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      }

      const res = await api.get('/admin/logs', { params })
      setLogs(res.data.data || [])
      setPagination(res.data.pagination)
    } catch (err) {
      console.error('Error fetching logs:', err)
    } finally {
      setLoading(false)
    }
  }

  // Trigger fetch when filter page or trigger submits
  useEffect(() => {
    fetchLogs()
  }, [page, action, role])

  function handleFilterSubmit(e) {
    e.preventDefault()
    setPage(1)
    fetchLogs()
  }

  function handleReset() {
    setSearch('')
    setAction('')
    setRole('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  // Helper to format action badges
  const getActionBadge = (act) => {
    let style = { background: 'rgba(100, 116, 139, 0.1)', color: 'var(--color-outline)' }
    if (act.includes('CREATE') || act.includes('ADD')) {
      style = { background: 'rgba(40, 167, 69, 0.1)', color: '#28a745' }
    } else if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('LOCK')) {
      style = { background: 'rgba(220, 53, 69, 0.1)', color: '#dc3545' }
    } else if (act.includes('UPDATE') || act.includes('EDIT')) {
      style = { background: 'rgba(0, 91, 191, 0.1)', color: 'var(--color-primary)' }
    } else if (act.includes('RESOLVE')) {
      style = { background: 'rgba(23, 162, 184, 0.1)', color: '#17a2b8' }
    }

    return (
      <span style={{
        fontSize: '11px',
        fontWeight: '700',
        padding: '4px 10px',
        borderRadius: 'var(--radius-full)',
        textTransform: 'uppercase',
        ...style
      }}>
        {act.replace('_', ' ')}
      </span>
    )
  }

  // Helper to format details nicely
  const formatDetails = (details) => {
    if (!details) return ''
    if (typeof details === 'string') return details
    
    // Format JSON object key-value pairs
    return Object.entries(details).map(([key, val]) => {
      // capitalize key
      const keyFormatted = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
      return (
        <div key={key} style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>
          <strong style={{ fontWeight: 600 }}>{keyFormatted}:</strong> {String(val)}
        </div>
      )
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Filtering Box */}
      <form onSubmit={handleFilterSubmit} className="admin-card card-base" style={{ padding: '20px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: '16px' }}>Bộ lọc tìm kiếm</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
          {/* Text search */}
          <div>
            <label className="text-label-md" style={{ color: 'var(--color-on-surface-variant)', display: 'block', marginBottom: '6px' }}>Tìm theo Người thực hiện</label>
            <input
              type="text"
              placeholder="Tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-outline-variant)',
                background: 'var(--color-surface-container-lowest)',
                color: 'var(--color-on-surface)',
                outline: 'none'
              }}
            />
          </div>

          {/* Action category */}
          <div>
            <label className="text-label-md" style={{ color: 'var(--color-on-surface-variant)', display: 'block', marginBottom: '6px' }}>Hành động</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-outline-variant)',
                background: 'var(--color-surface-container-lowest)',
                color: 'var(--color-on-surface)',
                outline: 'none'
              }}
            >
              <option value="">Tất cả hành động</option>
              <option value="CREATE_CLASS">Tạo lớp học (CREATE_CLASS)</option>
              <option value="UPDATE_CLASS">Cập nhật lớp (UPDATE_CLASS)</option>
              <option value="DELETE_CLASS">Xóa lớp học (DELETE_CLASS)</option>
              <option value="ADD_STUDENT">Thêm học sinh (ADD_STUDENT)</option>
              <option value="REMOVE_STUDENT">Xóa học sinh (REMOVE_STUDENT)</option>
              <option value="CREATE_PROMPT">Tạo Prompt AI (CREATE_PROMPT)</option>
              <option value="UPDATE_PROMPT">Cập nhật Prompt (UPDATE_PROMPT)</option>
              <option value="DELETE_PROMPT">Xóa Prompt AI (DELETE_PROMPT)</option>
              <option value="LOCK_USER">Khóa tài khoản (LOCK_USER)</option>
              <option value="APPROVE_USER">Phê duyệt (APPROVE_USER)</option>
              <option value="RESOLVE_ALERT">Xử lý cảnh báo (RESOLVE_ALERT)</option>
            </select>
          </div>

          {/* Actor role */}
          <div>
            <label className="text-label-md" style={{ color: 'var(--color-on-surface-variant)', display: 'block', marginBottom: '6px' }}>Vai trò</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-outline-variant)',
                background: 'var(--color-surface-container-lowest)',
                color: 'var(--color-on-surface)',
                outline: 'none'
              }}
            >
              <option value="">Tất cả vai trò</option>
              <option value="admin">Quản trị viên (Admin)</option>
              <option value="teacher">Giáo viên (Teacher)</option>
              <option value="student">Học sinh (Student)</option>
            </select>
          </div>

          {/* Dates */}
          <div>
            <label className="text-label-md" style={{ color: 'var(--color-on-surface-variant)', display: 'block', marginBottom: '6px' }}>Từ ngày</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-outline-variant)',
                background: 'var(--color-surface-container-lowest)',
                color: 'var(--color-on-surface)',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label className="text-label-md" style={{ color: 'var(--color-on-surface-variant)', display: 'block', marginBottom: '6px' }}>Đến ngày</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-outline-variant)',
                background: 'var(--color-surface-container-lowest)',
                color: 'var(--color-on-surface)',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '8px 20px',
              border: '1px solid var(--color-outline-variant)',
              background: 'transparent',
              color: 'var(--color-on-surface-variant)',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Reset
          </button>
          
          <button
            type="submit"
            style={{
              padding: '8px 24px',
              border: 'none',
              background: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Lọc kết quả
          </button>
        </div>
      </form>

      {/* Logs Table Card */}
      <div className="admin-card card-base" style={{ padding: '0px', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--color-outline-variant)' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-on-surface)' }}>Lịch sử hoạt động ({pagination.total} bản ghi)</h4>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px' }}>
            <span className="material-symbols-outlined animate-spin" style={{ fontSize: 40, color: 'var(--color-primary)' }}>
              progress_activity
            </span>
            <p className="text-body-md" style={{ color: 'var(--color-outline)' }}>Đang tìm kiếm nhật ký...</p>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--color-outline)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: '16px' }}>search_off</span>
            <p className="text-title-medium" style={{ fontWeight: 600, color: 'var(--color-on-surface)' }}>Không tìm thấy nhật ký tương ứng</p>
            <p className="text-body-md" style={{ marginTop: '4px' }}>Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-container-low)', borderBottom: '1px solid var(--color-outline-variant)' }}>
                  <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 700, color: 'var(--color-on-surface)' }}>Người thực hiện</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 700, color: 'var(--color-on-surface)' }}>Hành động</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 700, color: 'var(--color-on-surface)' }}>Đối tượng tác động</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 700, color: 'var(--color-on-surface)' }}>Chi tiết hoạt động</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 700, color: 'var(--color-on-surface)' }}>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const actor = log.user || { name: 'Hệ thống', email: 'system@lexigrow.vn', role: 'system' }
                  
                  return (
                    <tr key={log._id} style={{ borderBottom: '1px solid var(--color-outline-variant)', transition: 'background 0.2s' }}>
                      {/* Performer info */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={actor.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${actor.name}`}
                            alt={actor.name}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <p style={{ fontWeight: 600, color: 'var(--color-on-surface)', fontSize: '14px' }}>{actor.name}</p>
                            <p style={{ color: 'var(--color-outline)', fontSize: '12px' }}>{actor.email}</p>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: actor.role === 'admin' ? '#6f42c1' : actor.role === 'teacher' ? 'var(--color-primary)' : 'var(--color-outline)',
                              textTransform: 'uppercase'
                            }}>
                              {actor.role}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        {getActionBadge(log.action)}
                      </td>

                      {/* Target */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface)' }}>{log.targetType}</p>
                          {log.targetId && (
                            <p style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--color-outline)' }}>ID: {log.targetId.substring(0, 10)}...</p>
                          )}
                        </div>
                      </td>

                      {/* Details */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle', maxWidth: '300px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {formatDetails(log.details)}
                        </div>
                      </td>

                      {/* Created Time */}
                      <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--color-on-surface-variant)', verticalAlign: 'middle' }}>
                        <div>
                          <p>{new Date(log.createdAt).toLocaleDateString()}</p>
                          <p style={{ fontSize: '11px', color: 'var(--color-outline)' }}>{new Date(log.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid var(--color-outline-variant)' }}>
                <span className="text-label-md" style={{ color: 'var(--color-outline)' }}>
                  Trang {pagination.page} / {pagination.pages}
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      border: '1px solid var(--color-outline-variant)',
                      borderRadius: 'var(--radius-md)',
                      color: page === 1 ? 'var(--color-outline-variant)' : 'var(--color-on-surface)',
                      cursor: page === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
                    Trước
                  </button>

                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-outline-variant)',
                        background: p === page ? 'var(--color-primary)' : 'transparent',
                        color: p === page ? 'var(--color-on-primary)' : 'var(--color-on-surface)',
                        fontWeight: p === page ? 700 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    disabled={page === pagination.pages}
                    onClick={() => setPage(prev => Math.min(pagination.pages, prev + 1))}
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      border: '1px solid var(--color-outline-variant)',
                      borderRadius: 'var(--radius-md)',
                      color: page === pagination.pages ? 'var(--color-outline-variant)' : 'var(--color-on-surface)',
                      cursor: page === pagination.pages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    Sau
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
