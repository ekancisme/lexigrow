import { useState, useEffect } from 'react'
import api from '../../services/api.js'
import './AdminPages.css'

export default function AdminClassManagement() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Selected Class details
  const [selectedClass, setSelectedClass] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

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
      setError(err.message || 'Unable to load system classes.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectClass(classId) {
    setDetailLoading(true)
    setError('')
    try {
      const res = await api.get(`/classes/admin/${classId}`)
      setSelectedClass(res.data)
    } catch (err) {
      setError(err.message || 'Failed to load class details.')
    } finally {
      setDetailLoading(false)
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
        <p style={{ marginTop: 12, color: 'var(--color-on-surface-variant)' }}>Loading class list...</p>
      </div>
    )
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page__header">
        <div>
          <h2 className="admin-page__title">System Class Management</h2>
          <p className="admin-page__subtitle">View and manage all system classes, filtered by teacher</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="admin-card" style={{ background: '#fdf2f2', border: '1px solid #f8b4b4', color: '#9b1c1c', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Flex Layout for Stacked Panels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Left Side: Classes Table */}
        <div className="admin-card">
          <div className="admin-card__header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 20 }}>
            <h3 className="admin-card__title">All Classes ({filteredClasses.length})</h3>
          </div>

          {/* Filter Bar */}
          <div className="filter-bar" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="input-group">
              <input
                type="text"
                placeholder="Search classes by name..."
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
                <option value="">Filter by Teacher</option>
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
              No classes found.
            </div>
          ) : (
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-outline-variant)', color: 'var(--color-on-surface)' }}>
                    <th style={{ padding: '12px 8px', fontWeight: 'bold' }}>Class Name</th>
                    <th style={{ padding: '12px 8px', fontWeight: 'bold' }}>Teacher in Charge</th>
                    <th style={{ padding: '12px 8px', fontWeight: 'bold', textAlign: 'center' }}>Students</th>
                    <th style={{ padding: '12px 8px', fontWeight: 'bold' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClasses.map((cls) => (
                    <tr
                      key={cls._id}
                      onClick={() => handleSelectClass(cls._id)}
                      style={{
                        borderBottom: '1px solid var(--color-outline-variant)',
                        cursor: 'pointer',
                        backgroundColor: selectedClass?._id === cls._id ? 'rgba(0, 91, 191, 0.05)' : 'transparent',
                        transition: 'background 0.2s ease-in-out'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedClass?._id !== cls._id) {
                          e.currentTarget.style.backgroundColor = 'var(--color-surface-container-low)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedClass?._id !== cls._id) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >
                      <td style={{ padding: '14px 8px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-on-surface)' }}>{cls.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-outline)' }}>
                          {cls.description || 'No description'}
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

        {/* Right Side: Selected Class Details & Roster */}
        {selectedClass && (
          <div className="admin-card" style={{ padding: '24px', animation: 'fadeIn 0.3s ease-in-out' }}>
            {detailLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--color-outline)' }}>
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32, color: 'var(--color-primary)' }}>
                  progress_activity
                </span>
                <p style={{ marginTop: 12 }}>Loading class roster...</p>
              </div>
            ) : (
              <div>
                {/* Details Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                      {selectedClass.name}
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--color-outline)' }}>
                      Teacher: <strong>{selectedClass.teacher?.name || 'N/A'}</strong> ({selectedClass.teacher?.email || 'No email'})
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedClass(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-outline)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px'
                    }}
                    title="Close Details"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Class Info */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: 'var(--color-on-surface-variant)' }}>
                    Description
                  </h4>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-on-surface)', lineHeight: 1.4 }}>
                    {selectedClass.description || 'No description available for this class.'}
                  </p>
                </div>

                {/* Student Roster */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                      Student Roster ({selectedClass.students?.length || 0})
                    </h4>
                  </div>

                  {!selectedClass.students || selectedClass.students.length === 0 ? (
                    <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-outline)', border: '1px dashed var(--color-outline-variant)', borderRadius: '8px', fontSize: '13px' }}>
                      No students enrolled in this class.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                      {selectedClass.students.map((student) => (
                        <div
                          key={student._id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-outline-variant)',
                            backgroundColor: 'var(--color-surface-container-lowest)'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-on-surface)' }}>
                              {student.name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-outline)', marginTop: '2px' }}>
                              {student.email}
                            </div>
                          </div>
                          {student.englishLevel && (
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: 'rgba(0, 91, 191, 0.08)',
                                color: 'var(--color-primary)'
                              }}
                            >
                              {student.englishLevel}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
