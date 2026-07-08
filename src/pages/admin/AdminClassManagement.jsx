import { useState, useEffect } from 'react'
import api from '../../services/api.js'
import './AdminPages.css'

export default function AdminClassManagement() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchClasses()
  }, [])

  async function fetchClasses() {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/classes/admin')
      setClasses(res.data || [])
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách lớp học hệ thống.')
    } finally {
      setLoading(false)
    }
  }

  // Get unique teachers from loaded classes list for the filter dropdown
  const uniqueTeachers = []
  classes.forEach((c) => {
    if (c.teacher && !uniqueTeachers.some((t) => t._id === c.teacher._id)) {
      uniqueTeachers.push(c.teacher)
    }
  })

  // Filter classes
  const filteredClasses = classes.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTeacher = selectedTeacher ? c.teacher?._id === selectedTeacher : true
    return matchesSearch && matchesTeacher
  })

  if (loading) {
    return (
      <div className="admin-page" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
        <p style={{ marginTop: 12, color: 'var(--color-on-surface-variant)' }}>Đang tải danh sách lớp học...</p>
      </div>
    )
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page__header">
        <div>
          <h2 className="admin-page__title">Quản lý Lớp học Hệ thống</h2>
          <p className="admin-page__subtitle">Xem danh sách toàn bộ các lớp học và lọc thông tin theo giáo viên phụ trách</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="admin-card" style={{ background: '#fdf2f2', border: '1px solid #f8b4b4', color: '#9b1c1c', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Card */}
      <div className="admin-card">
        <div className="admin-card__header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 20 }}>
          <h3 className="admin-card__title">Tất cả lớp học ({filteredClasses.length})</h3>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Tìm kiếm lớp học theo tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-outline-variant)',
                backgroundColor: 'var(--color-surface-container-low)',
                color: 'var(--color-on-surface)'
              }}
            />
          </div>

          <div className="input-group">
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-outline-variant)',
                backgroundColor: 'var(--color-surface-container-low)',
                color: 'var(--color-on-surface)'
              }}
            >
              <option value="">Lọc theo Giáo viên</option>
              {uniqueTeachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table of Classes */}
        {filteredClasses.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-outline)' }}>
            Không tìm thấy lớp học nào.
          </div>
        ) : (
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-outline-variant)', color: 'var(--color-on-surface)' }}>
                  <th style={{ padding: '12px 8px', fontWeight: 'bold' }}>Tên Lớp học</th>
                  <th style={{ padding: '12px 8px', fontWeight: 'bold' }}>Giáo viên Phụ trách</th>
                  <th style={{ padding: '12px 8px', fontWeight: 'bold', textAlign: 'center' }}>Sĩ số</th>
                  <th style={{ padding: '12px 8px', fontWeight: 'bold' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map((cls) => (
                  <tr
                    key={cls._id}
                    style={{ borderBottom: '1px solid var(--color-outline-variant)' }}
                  >
                    <td style={{ padding: '14px 8px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-on-surface)' }}>{cls.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-outline)' }}>
                        {cls.description || 'Không có mô tả'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 8px' }}>
                      <div style={{ color: 'var(--color-on-surface)' }}>{cls.teacher?.name || 'N/A'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-outline)' }}>
                        {cls.teacher?.email || ''}
                      </div>
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                      {cls.studentCount}
                    </td>
                    <td style={{ padding: '14px 8px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          backgroundColor: cls.status === 'active' ? 'rgba(40, 167, 69, 0.1)' : 'rgba(108, 117, 125, 0.1)',
                          color: cls.status === 'active' ? '#28a745' : '#6c757d'
                        }}
                      >
                        {cls.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
