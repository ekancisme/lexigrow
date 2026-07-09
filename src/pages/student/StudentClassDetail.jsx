import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import { getSocket } from '../../services/socket.js'
import './StudentClassDetail.css'

export default function StudentClassDetail() {
  const navigate = useNavigate()
  const { classId } = useParams()

  const [classes, setClasses] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [classDetail, setClassDetail] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [essays, setEssays] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Join by class code
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinMessage, setJoinMessage] = useState(null)

  // Tab State
  const [activeTab, setActiveTab] = useState('overview')

  // Selected assignment for popup modal detail
  const [selectedAssignment, setSelectedAssignment] = useState(null)

  // Load basic classes (for listing or auto-redirect)
  useEffect(() => {
    if (classId) return // If detail view, run other loader

    async function loadClassesAndPending() {
      try {
        setLoading(true)
        const [classesRes, pendingRes] = await Promise.all([
          api.get('/classes'),
          api.get('/classes/my-pending'),
        ])
        const data = classesRes.data || []
        const pending = pendingRes.data || []
        setClasses(data)
        setPendingRequests(pending)

        // UX Shortcut: If student belongs to exactly 1 class, auto-redirect
        if (data.length === 1) {
          navigate(`/student/class/${data[0]._id}`, { replace: true })
        }
      } catch (err) {
        console.error('Error fetching classes:', err)
        setError(err.message || 'Failed to load classes.')
      } finally {
        setLoading(false)
      }
    }
    loadClassesAndPending()
  }, [classId, navigate])

  async function handleJoinClass(e) {
    e.preventDefault()
    const code = joinCode.trim()
    if (!code) return

    setJoining(true)
    setJoinMessage(null)
    try {
      const res = await api.post('/classes/join', { code })
      setJoinCode('')
      setJoinMessage({
        type: 'success',
        text: res.message || 'Yêu cầu tham gia đã được gửi. Vui lòng chờ giáo viên duyệt.',
      })
      const pendingRes = await api.get('/classes/my-pending')
      setPendingRequests(pendingRes.data || [])
    } catch (err) {
      setJoinMessage({ type: 'error', text: err.message || 'Không thể gửi yêu cầu tham gia.' })
    } finally {
      setJoining(false)
    }
  }

  // Helper function to fetch assignments and student essays (optionally silently in the background)
  async function fetchAssignmentsAndEssays(silent = false) {
    if (!classId) return
    try {
      if (!silent) setLoading(true)
      const [assignRes, essaysRes] = await Promise.all([
        api.get(`/assignments?classId=${classId}`),
        api.get('/essays?limit=1000')
      ])
      setAssignments(assignRes.data || [])
      setEssays(essaysRes.data || [])
    } catch (err) {
      console.error('Error fetching assignments & essays:', err)
      if (!silent) setError(err.message || 'Failed to load assignments.')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  // Load single class detail & assignments & essays
  useEffect(() => {
    if (!classId) return

    async function loadDetailData() {
      try {
        setLoading(true)
        setError(null)

        // 1. Fetch class details (overview, teacher, classmates)
        const classRes = await api.get(`/classes/${classId}/student-view`)
        setClassDetail(classRes.data)

        // 2. Fetch assignments & essays
        await fetchAssignmentsAndEssays(true)
      } catch (err) {
        console.error('Error loading class details:', err)
        setError(err.message || 'Failed to load class details.')
      } finally {
        setLoading(false)
      }
    }
    loadDetailData()
  }, [classId])

  // Trigger a silent background update of assignments when student switches to the 'assignments' tab
  useEffect(() => {
    if (classId && activeTab === 'assignments') {
      fetchAssignmentsAndEssays(true)
    }
  }, [activeTab, classId])

  // Real-time listener: reload assignments or class list on relevant notifications
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleRealtimeNotification = async (notif) => {
      if (classId && notif.type === 'assignment') {
        fetchAssignmentsAndEssays(true)
        return
      }

      if (!classId && (notif.title === 'Join Request Approved' || notif.title === 'Join Request Declined')) {
        try {
          const [classesRes, pendingRes] = await Promise.all([
            api.get('/classes'),
            api.get('/classes/my-pending'),
          ])
          const data = classesRes.data || []
          setClasses(data)
          setPendingRequests(pendingRes.data || [])
          if (data.length === 1) {
            navigate(`/student/class/${data[0]._id}`, { replace: true })
          }
        } catch (err) {
          console.error('Error refreshing classes after join notification:', err)
        }
      }
    }

    socket.on('notification', handleRealtimeNotification)
    return () => {
      socket.off('notification', handleRealtimeNotification)
    }
  }, [classId, navigate])

  // Helper to determine assignment status for the student
  function getAssignmentStatus(assignId) {
    const studentEssay = essays.find(e => e.assignment === assignId || e.assignment?._id === assignId)
    if (!studentEssay) return { status: 'not_started', label: 'Not Started', essay: null }

    switch (studentEssay.status) {
      case 'draft':
        return { status: 'draft', label: 'Draft', essay: studentEssay }
      case 'submitted':
        return { status: 'submitted', label: 'Submitted', essay: studentEssay }
      case 'reviewed':
        return { status: 'reviewed', label: 'Graded', essay: studentEssay }
      case 'needs_revision':
        return { status: 'needs_revision', label: 'Revision Requested', essay: studentEssay }
      default:
        return { status: 'not_started', label: 'Not Started', essay: null }
    }
  }

  // ── RENDER LOADING ──
  if (loading) {
    return (
      <div className="student-class__loading">
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
      </div>
    )
  }

  // ── RENDER ERROR ──
  if (error) {
    return (
      <div className="student-class">
        <div className="student-class__empty">
          <span className="material-symbols-outlined" style={{ color: 'var(--color-error)' }}>error_outline</span>
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button className="class-overview__action-btn" style={{ marginTop: 16 }} onClick={() => navigate('/student/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ── RENDER LIST OF CLASSES (If enrolled in >1 class, or 0 classes) ──
  if (!classId) {
    return (
      <div className="student-class">
        <div className="student-class__header">
          <h2 className="student-class__title">My Classes</h2>
          <p className="student-class__subtitle">Select a class to view assignments and classmates</p>
        </div>

        {/* Join by class code */}
        <section className="card-base student-class__join-card">
          <div className="student-class__join-header">
            <span className="material-symbols-outlined">key</span>
            <div>
              <h3 className="student-class__join-title">Vào lớp bằng mã code</h3>
              <p className="student-class__join-desc">Nhập mã lớp học do giáo viên cung cấp để gửi yêu cầu tham gia.</p>
            </div>
          </div>
          <form className="student-class__join-form" onSubmit={handleJoinClass}>
            <input
              type="text"
              className="student-class__join-input"
              placeholder="Nhập mã lớp (VD: ABC123)"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase())
                if (joinMessage) setJoinMessage(null)
              }}
              maxLength={8}
              disabled={joining}
            />
            <button
              type="submit"
              className="class-mgmt__submit-btn"
              disabled={joining || !joinCode.trim()}
            >
              {joining ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </form>
          {joinMessage && (
            <p className={`student-class__join-message student-class__join-message--${joinMessage.type}`}>
              {joinMessage.text}
            </p>
          )}
        </section>

        {/* Pending join requests */}
        {pendingRequests.length > 0 && (
          <section className="card-base student-class__pending-card">
            <div className="student-class__pending-header">
              <span className="material-symbols-outlined">hourglass_top</span>
              <span>Đang chờ giáo viên duyệt ({pendingRequests.length})</span>
            </div>
            <div className="student-class__pending-list">
              {pendingRequests.map(cls => (
                <div key={cls._id} className="student-class__pending-item">
                  <div>
                    <p className="student-class__pending-name">{cls.name}</p>
                    <p className="student-class__pending-meta">
                      Giáo viên: {cls.teacher?.name || 'N/A'}
                    </p>
                  </div>
                  <span className="student-class__badge student-class__badge--pending">Chờ duyệt</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {classes.length === 0 ? (
          pendingRequests.length === 0 ? (
            <div className="student-class__empty card-base">
              <span className="material-symbols-outlined">school</span>
              <p>Bạn chưa tham gia lớp học nào.</p>
              <p className="text-body-sm" style={{ color: 'var(--color-outline)', marginTop: 8 }}>
                Nhập mã lớp học ở trên hoặc liên hệ giáo viên để được thêm vào lớp.
              </p>
            </div>
          ) : null
        ) : (
          <div className="student-class__list-grid">
            {classes.map(cls => (
              <div
                key={cls._id}
                className="card-base student-class__card"
                onClick={() => navigate(`/student/class/${cls._id}`)}
              >
                <div>
                  <h3 className="student-class__card-name">{cls.name}</h3>
                  <p className="student-class__card-desc">{cls.description || 'No class description provided.'}</p>
                </div>
                <div className="student-class__card-footer">
                  <span className="student-class__card-teacher">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person</span>
                    Teacher: {cls.teacher?.name || 'N/A'}
                  </span>
                  <span className="student-class__card-teacher">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>group</span>
                    {cls.studentCount || 0} classmates
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── RENDER SINGLE CLASS DETAIL (TABS VIEW) ──
  return (
    <div className="student-class">
      {/* Back to list button if enrolled in multiple classes */}
      {classes.length > 1 && (
        <button 
          className="assignment-detail__back" 
          onClick={() => navigate('/student/class')}
          style={{ marginBottom: 12 }}
        >
          <span className="material-symbols-outlined">arrow_back</span> Back to Classes
        </button>
      )}

      {/* Class title header */}
      <div className="student-class__header">
        <h2 className="student-class__title">{classDetail?.name}</h2>
        <p className="student-class__subtitle">{classDetail?.schedule || 'No schedule set'}</p>
      </div>

      {/* Tabs Menu */}
      <div className="student-class__tabs">
        <button
          className={`student-class__tab-btn ${activeTab === 'overview' ? 'student-class__tab-btn--active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>overview</span>
          Overview
        </button>
        <button
          className={`student-class__tab-btn ${activeTab === 'classmates' ? 'student-class__tab-btn--active' : ''}`}
          onClick={() => setActiveTab('classmates')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>group</span>
          Classmates
        </button>
        <button
          className={`student-class__tab-btn ${activeTab === 'assignments' ? 'student-class__tab-btn--active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>assignment</span>
          Assignments
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="student-class__overview-grid animate-fade-in">
          {/* Class details */}
          <section className="card-base student-class__info-card">
            <div className="student-class__info-section">
              <h4>Class Description</h4>
              <p>{classDetail?.description || 'No description provided for this class.'}</p>
            </div>
            <div className="student-class__info-section">
              <h4>Class Status</h4>
              <p style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--color-primary)' }}>
                {classDetail?.status || 'Active'}
              </p>
            </div>
          </section>

          {/* Teacher details */}
          <section className="card-base student-class__teacher-card">
            <div className="student-class__teacher-avatar">
              <span className="material-symbols-outlined" style={{ fontSize: 32 }}>account_box</span>
            </div>
            <p className="student-class__teacher-title">Teacher In Charge</p>
            <h3 className="student-class__teacher-name">{classDetail?.teacher?.name || 'N/A'}</h3>
            {classDetail?.teacher?.email && (
              <a href={`mailto:${classDetail.teacher.email}`} className="student-class__teacher-contact">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>mail</span>
                {classDetail.teacher.email}
              </a>
            )}
          </section>
        </div>
      )}

      {/* ── TAB 2: CLASSMATES ── */}
      {activeTab === 'classmates' && (
        <section className="card-base student-class__table-card animate-fade-in">
          <table className="student-class__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>English Level</th>
              </tr>
            </thead>
            <tbody>
              {classDetail?.students?.map(student => (
                <tr key={student._id}>
                  <td>
                    <div className="student-class__student-name">{student.name}</div>
                  </td>
                  <td>{student.email}</td>
                  <td>
                    <span className="student-class__badge" style={{ backgroundColor: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)' }}>
                      {student.englishLevel || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ── TAB 3: ASSIGNMENTS ── */}
      {activeTab === 'assignments' && (
        <section className="card-base student-class__table-card animate-fade-in">
          {assignments.length === 0 ? (
            <div className="student-class__empty">
              <span className="material-symbols-outlined">assignment</span>
              <p>No assignments have been posted to this class yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="student-class__table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Due Date</th>
                    <th>Required Keywords</th>
                    <th>My Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(a => {
                    const { status, label, essay } = getAssignmentStatus(a._id)
                    const isPast = new Date(a.dueDate) < new Date()

                    return (
                      <tr 
                        key={a._id}
                        onClick={() => setSelectedAssignment(a)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <div className="student-class__student-name">{a.title}</div>
                          <div className="student-class__student-email" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.description || 'No task brief details.'}
                          </div>
                        </td>
                        <td style={{ color: isPast && status !== 'reviewed' && status !== 'submitted' ? 'var(--color-error)' : 'inherit' }}>
                          {new Date(a.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          {a.keywords?.length > 0 
                            ? a.keywords.map(kw => (
                                <span key={kw} className="assignment-detail__keyword-chip" style={{ display: 'inline-block', margin: '2px' }}>
                                  {kw}
                                </span>
                              ))
                            : <span style={{ color: 'var(--color-outline)' }}>None</span>
                          }
                        </td>
                        <td>
                          <span className={`student-class__badge student-class__badge--${status}`}>
                            {label}
                          </span>
                        </td>
                        <td>
                          {status === 'not_started' && (
                            <button
                              className="class-overview__action-btn"
                              disabled={isPast}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/student/write-essay?assignmentId=${a._id}`);
                              }}
                            >
                              Start Writing
                            </button>
                          )}
                          {status === 'draft' && (
                            <button
                              className="class-overview__action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/student/write-essay?id=${essay._id}`);
                              }}
                            >
                              Continue
                            </button>
                          )}
                          {status === 'submitted' && (
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-outline)', fontWeight: 500 }}>
                              Waiting for Grade
                            </span>
                          )}
                          {status === 'reviewed' && (
                            <button
                              className="class-overview__action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/student/feedback?id=${essay._id}`);
                              }}
                            >
                              View Feedback
                            </button>
                          )}
                          {status === 'needs_revision' && (
                            <button
                              className="class-overview__action-btn"
                              style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/student/write-essay?id=${essay._id}`);
                              }}
                            >
                              Revise Essay
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Assignment Detail Modal */}
      {selectedAssignment && (
        <div className="student-class__modal-overlay" onClick={() => setSelectedAssignment(null)}>
          <div className="student-class__modal card-base" onClick={(e) => e.stopPropagation()}>
            <div className="student-class__modal-header">
              <h3 className="student-class__modal-title">{selectedAssignment.title}</h3>
              <button className="student-class__modal-close" onClick={() => setSelectedAssignment(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="student-class__modal-body">
              <div className="student-class__modal-detail-item">
                <h5>Task Description / Brief</h5>
                <div className="student-class__modal-desc-box">
                  {selectedAssignment.description || 'No detailed instructions provided.'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="student-class__modal-detail-item">
                  <h5>Due Date</h5>
                  <p style={{ fontWeight: 600 }}>
                    {new Date(selectedAssignment.dueDate).toLocaleString('en-GB', { 
                      day: '2-digit', month: 'short', year: 'numeric', 
                      hour: '2-digit', minute: '2-digit' 
                    })}
                  </p>
                </div>
                
                <div className="student-class__modal-detail-item">
                  <h5>Status</h5>
                  <div>
                    {(() => {
                      const { status, label } = getAssignmentStatus(selectedAssignment._id)
                      return (
                        <span className={`student-class__badge student-class__badge--${status}`} style={{ marginTop: '4px' }}>
                          {label}
                        </span>
                      )
                    })()}
                  </div>
                </div>
              </div>

              <div className="student-class__modal-detail-item">
                <h5>Required Keywords</h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {selectedAssignment.keywords?.length > 0 ? (
                    selectedAssignment.keywords.map(kw => (
                      <span key={kw} className="assignment-detail__keyword-chip" style={{ margin: 0 }}>
                        {kw}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--color-outline)', fontSize: '0.9rem' }}>No keywords required.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="student-class__modal-footer">
              <button className="class-mgmt__cancel-btn" onClick={() => setSelectedAssignment(null)}>Close</button>
              {(() => {
                const { status, essay } = getAssignmentStatus(selectedAssignment._id)
                const isPast = new Date(selectedAssignment.dueDate) < new Date()

                if (status === 'not_started' && !isPast) {
                  return (
                    <button 
                      className="class-mgmt__submit-btn"
                      onClick={() => {
                        setSelectedAssignment(null)
                        navigate(`/student/write-essay?assignmentId=${selectedAssignment._id}`)
                      }}
                    >
                      Start Writing
                    </button>
                  )
                }
                if (status === 'draft' || status === 'needs_revision') {
                  return (
                    <button 
                      className="class-mgmt__submit-btn"
                      onClick={() => {
                        setSelectedAssignment(null)
                        navigate(`/student/write-essay?id=${essay._id}`)
                      }}
                    >
                      {status === 'draft' ? 'Continue Draft' : 'Revise Essay'}
                    </button>
                  )
                }
                if (status === 'reviewed') {
                  return (
                    <button 
                      className="class-mgmt__submit-btn"
                      onClick={() => {
                        setSelectedAssignment(null)
                        navigate(`/student/feedback?id=${essay._id}`)
                      }}
                    >
                      View Feedback
                    </button>
                  )
                }
                return null
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
