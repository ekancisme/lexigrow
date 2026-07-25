import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api.js'
import { useModal } from '../../contexts/ModalContext.jsx'
import './AdminUsers.css'

/* ── Constants ──────────────────────────────────────────── */
const ROLES = ['all', 'student', 'teacher', 'parent', 'admin']
const STATUSES = ['all', 'active', 'suspended', 'pending_approval', 'rejected']

const ROLE_META = {
  student: { label: 'Student', icon: 'school', cls: 'role--student' },
  teacher: { label: 'Teacher', icon: 'person_book', cls: 'role--teacher' },
  parent: { label: 'Parent', icon: 'family_restroom', cls: 'role--parent' },
  admin: { label: 'Admin', icon: 'text_snippet', cls: 'role--admin' },
}

const STATUS_META = {
  active: { label: 'Active', icon: 'check_circle', cls: 'status--active' },
  suspended: { label: 'Suspended', icon: 'block', cls: 'status--suspended' },
  pending_approval: { label: 'Pending', icon: 'pending', cls: 'status--pending' },
  rejected: { label: 'Rejected', icon: 'cancel', cls: 'status--rejected' },
}

function RoleBadge({ role }) {
  const m = ROLE_META[role] || { label: role, icon: 'person', cls: '' }
  return (
    <span className={`au-badge au-badge--role ${m.cls}`}>
      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{m.icon}</span>
      {m.label}
    </span>
  )
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, icon: 'help', cls: '' }
  return (
    <span className={`au-badge au-badge--status ${m.cls}`}>
      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{m.icon}</span>
      {m.label}
    </span>
  )
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ── User Detail Modal ───────────────────────────────────── */
function UserModal({ user, onClose, onAction }) {
  const [newStatus, setNewStatus] = useState(user.accountStatus || 'active')
  const [newRole, setNewRole] = useState(user.role)
  const [newPassword, setNewPassword] = useState('')
  const [statusNote, setStatusNote] = useState(user.statusNote || '')
  const [saving, setSaving] = useState(false)
  const { showConfirm } = useModal()

  async function applyStatusChange() {
    if (newStatus === user.accountStatus) return
    setSaving(true)
    try {
      const res = await api.patch(`/admin/users/${user._id}/status`, { status: newStatus, note: statusNote })
      onAction('status', res.data)
    } catch (err) {
      alert(err.message)
    } finally { setSaving(false) }
  }

  async function applyRoleChange() {
    if (newRole === user.role) return
    setSaving(true)
    try {
      const res = await api.patch(`/admin/users/${user._id}/role`, { role: newRole })
      onAction('role', res.data)
    } catch (err) {
      alert(err.message)
    } finally { setSaving(false) }
  }

  async function applyPasswordReset() {
    if (!newPassword || newPassword.length < 6) return alert('Password must be at least 6 characters')
    setSaving(true)
    try {
      await api.post(`/admin/users/${user._id}/reset-password`, { newPassword })
      setNewPassword('')
      alert('Password reset successfully!')
    } catch (err) {
      alert(err.message)
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    showConfirm('Delete User', `Delete user "${user.name}"? This cannot be undone.`, async () => {
      setSaving(true)
      try {
        await api.delete(`/admin/users/${user._id}`)
        onAction('delete', user)
      } catch (err) {
        alert(err.message)
      } finally { setSaving(false) }
    })
  }

  return (
    <div className="au-modal-overlay" onClick={onClose}>
      <div className="au-modal" onClick={e => e.stopPropagation()}>
        <div className="au-modal__header">
          <div className="au-modal__avatar">
            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>person</span>
          </div>
          <div className="au-modal__title-block">
            <h3 className="au-modal__name">{user.name}</h3>
            <p className="au-modal__email">{user.email}</p>
            <div className="au-modal__badges">
              <RoleBadge role={user.role} />
              <StatusBadge status={user.accountStatus || 'active'} />
            </div>
          </div>
          <button className="au-modal__close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="au-modal__body">
          {/* Info */}
          <div className="au-modal__info-grid">
            {user.institution && (
              <div className="au-modal__info-row">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>business</span>
                <span>{user.institution}</span>
              </div>
            )}
            {user.englishLevel && (
              <div className="au-modal__info-row">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>signal_cellular_alt</span>
                <span>Level {user.englishLevel}</span>
              </div>
            )}
            <div className="au-modal__info-row">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>calendar_today</span>
              <span>Joined {formatDate(user.createdAt)}</span>
            </div>
            {user.statusNote && (
              <div className="au-modal__info-row au-modal__info-row--note">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>notes</span>
                <span>{user.statusNote}</span>
              </div>
            )}
          </div>

          {user.role !== 'admin' && (
            <>
              <hr className="au-modal__divider" />

              {/* Change Status */}
              <div className="au-modal__section">
                <h4 className="au-modal__section-title">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>manage_accounts</span>
                  Account Status
                </h4>
                <div className="au-modal__row">
                  <select
                    className="au-select"
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                  >
                    {STATUSES.filter(s => s !== 'all').map(s => (
                      <option key={s} value={s}>{STATUS_META[s]?.label || s}</option>
                    ))}
                  </select>
                  <button className="au-btn au-btn--primary" onClick={applyStatusChange} disabled={saving || newStatus === user.accountStatus}>
                    Apply Status
                  </button>
                </div>
                <input
                  className="au-input"
                  placeholder="Optional note (reason for suspension, etc.)"
                  value={statusNote}
                  onChange={e => setStatusNote(e.target.value)}
                />
              </div>

              {/* Change Role */}
              <div className="au-modal__section">
                <h4 className="au-modal__section-title">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>swap_horiz</span>
                  Change Role
                </h4>
                <div className="au-modal__row">
                  <select
                    className="au-select"
                    value={newRole}
                    onChange={e => setNewRole(e.target.value)}
                  >
                    {ROLES.filter(r => r !== 'all').map(r => (
                      <option key={r} value={r}>{ROLE_META[r]?.label || r}</option>
                    ))}
                  </select>
                  <button className="au-btn au-btn--secondary" onClick={applyRoleChange} disabled={saving || newRole === user.role}>
                    Apply Role
                  </button>
                </div>
              </div>

              {/* Reset Password */}
              <div className="au-modal__section">
                <h4 className="au-modal__section-title">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock_reset</span>
                  Reset Password
                </h4>
                <div className="au-modal__row">
                  <input
                    className="au-input"
                    type="password"
                    placeholder="New password (min 6 chars)"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                  <button className="au-btn au-btn--warning" onClick={applyPasswordReset} disabled={saving}>
                    Reset
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="au-modal__section au-modal__section--danger">
                <h4 className="au-modal__section-title au-modal__section-title--danger">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete_forever</span>
                  Danger Zone
                </h4>
                <button className="au-btn au-btn--danger" onClick={handleDelete} disabled={saving}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                  Delete User Permanently
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Approval Card ───────────────────────────────────────── */
function ApprovalCard({ user, onApprove, onReject, onVerifyViaStudent, processing }) {
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)

  return (
    <div className={`au-approval-card card-base ${processing === user._id ? 'au-approval-card--loading' : ''}`}>
      <div className="au-approval-card__header">
        <div className="au-approval-card__avatar">
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
            {ROLE_META[user.role]?.icon || 'person'}
          </span>
        </div>
        <div className="au-approval-card__info">
          <h4 className="au-approval-card__name">{user.name}</h4>
          <p className="au-approval-card__email">{user.email}</p>
          {user.institution && (
            <p className="au-approval-card__meta">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>business</span>
              {user.institution}
            </p>
          )}
          {user.children && user.children.length > 0 && (
            <p className="au-approval-card__meta">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>child_care</span>
              Con: {user.children[0]?.name ? `${user.children[0].name} (${user.children[0].email})` : 'Linked child on file'}
            </p>
          )}
          {user.statusNote && (
            <p className="au-approval-card__meta" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>info</span>
              {user.statusNote}
            </p>
          )}
        </div>
        <div className="au-approval-card__right">
          <RoleBadge role={user.role} />
          <p className="au-approval-card__date">{formatDate(user.createdAt)}</p>
        </div>
      </div>

      {showReject ? (
        <div className="au-approval-card__reject-form">
          <input
            className="au-input"
            placeholder="Reason for rejection (optional)"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
          <div className="au-approval-card__actions">
            <button className="au-btn au-btn--ghost" onClick={() => setShowReject(false)}>Cancel</button>
            <button
              className="au-btn au-btn--danger"
              onClick={() => onReject(user._id, rejectReason)}
              disabled={processing === user._id}
            >
              Confirm Reject
            </button>
          </div>
        </div>
      ) : (
        <div className="au-approval-card__actions">
          {user.role === 'parent' && user.children && user.children.length > 0 && (
            <button
              className="au-btn au-btn--secondary"
              onClick={() => onVerifyViaStudent(user._id)}
              disabled={processing === user._id}
              style={{ marginRight: 'auto' }}
            >
              {processing === user._id ? (
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span>
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>send_and_archive</span>
              )}
              Verify via Student
            </button>
          )}
          <button
            className="au-btn au-btn--danger-ghost"
            onClick={() => setShowReject(true)}
            disabled={processing === user._id}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
            Reject
          </button>
          <button
            className="au-btn au-btn--success"
            onClick={() => onApprove(user._id)}
            disabled={processing === user._id}
          >
            {processing === user._id ? (
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span>
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
            )}
            Approve
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Main Component ──────────────────────────────────────── */
export default function AdminUsers() {
  const [tab, setTab] = useState('users')   // 'users' | 'approvals'
  const [users, setUsers] = useState([])
  const [approvals, setApprovals] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedUser, setSelectedUser] = useState(null)
  const [processing, setProcessing] = useState(null)

  /* ── Load users ── */
  const loadUsers = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: p, limit: 15 })
      if (search) params.set('search', search)
      if (roleFilter !== 'all') params.set('role', roleFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await api.get(`/admin/users?${params}`)
      setUsers(res.data)
      setTotal(res.total)
      setTotalPages(res.pages)
      setPage(p)
      if (res.summary) setSummary(res.summary)
    } catch (err) {
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter, statusFilter])

  /* ── Load approvals ── */
  const loadApprovals = useCallback(async () => {
    try {
      const res = await api.get('/admin/approvals?limit=50')
      setApprovals(res.data)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    loadUsers(1)
    loadApprovals()
  }, [loadUsers, loadApprovals])

  /* ── Actions ── */
  function handleModalAction(type, updatedUser) {
    if (type === 'delete') {
      setUsers(prev => prev.filter(u => u._id !== updatedUser._id))
      setSelectedUser(null)
    } else {
      setUsers(prev => prev.map(u => u._id === updatedUser._id ? { ...u, ...updatedUser } : u))
      setSelectedUser(prev => prev?._id === updatedUser._id ? { ...prev, ...updatedUser } : prev)
    }
  }

  async function handleApprove(userId) {
    setProcessing(userId)
    try {
      await api.post(`/admin/approvals/${userId}/approve`)
      setApprovals(prev => prev.filter(u => u._id !== userId))
      loadUsers(page)
    } catch (err) { alert(err.message) }
    finally { setProcessing(null) }
  }

  async function handleReject(userId, reason) {
    setProcessing(userId)
    try {
      await api.post(`/admin/approvals/${userId}/reject`, { reason })
      setApprovals(prev => prev.filter(u => u._id !== userId))
      loadUsers(page)
    } catch (err) { alert(err.message) }
    finally { setProcessing(null) }
  }

  async function handleVerifyViaStudent(userId) {
    setProcessing(userId)
    try {
      const res = await api.post(`/admin/approvals/${userId}/verify-via-student`)
      setApprovals(prev => prev.map(u => u._id === userId ? { ...u, statusNote: res.data.statusNote } : u))
      alert('Verification request sent to Student successfully!')
    } catch (err) { alert(err.message) }
    finally { setProcessing(null) }
  }

  /* ── Render ── */
  return (
    <div className="admin-page au">

      {/* HEADER */}
      <div className="admin-page__header">
        <div>
          <h2 className="admin-page__title">User Management</h2>
          <p className="admin-page__subtitle">Manage profiles, approve registrations, and assign role permissions</p>
        </div>
        <button className="au-btn au-btn--primary" onClick={() => loadUsers(page)}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
          Refresh
        </button>
      </div>

      {/* SUMMARY STATS */}
      {summary && (
        <div className="au-summary">
          {[
            { key: 'student', label: 'Students', icon: 'school', color: 'primary' },
            { key: 'teacher', label: 'Teachers', icon: 'person_book', color: 'secondary' },
            { key: 'parent', label: 'Parents', icon: 'family_restroom', color: 'tertiary' },
            { key: 'pending_approval', label: 'Pending', icon: 'pending', color: 'warning' },
            { key: 'suspended', label: 'Suspended', icon: 'block', color: 'error' },
          ].map(s => (
            <div key={s.key} className={`au-summary-card au-summary-card--${s.color}`}>
              <span className="material-symbols-outlined">{s.icon}</span>
              <div>
                <span className="au-summary-card__value">
                  {(summary.roleCounts[s.key] ?? summary.statusCounts[s.key]) ?? 0}
                </span>
                <span className="au-summary-card__label">{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TABS */}
      <div className="au-tabs">
        <button
          className={`au-tab ${tab === 'users' ? 'au-tab--active' : ''}`}
          onClick={() => setTab('users')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>group</span>
          All Users
          <span className="au-tab-count">{total}</span>
        </button>
        <button
          className={`au-tab ${tab === 'approvals' ? 'au-tab--active' : ''}`}
          onClick={() => setTab('approvals')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>pending_actions</span>
          Registration Requests
          {approvals.length > 0 && <span className="au-tab-count au-tab-count--alert">{approvals.length}</span>}
        </button>
      </div>

      {/* ── USERS TAB ── */}
      {tab === 'users' && (
        <>
          {/* Filters */}
          <div className="au-toolbar">
            <div className="au-search-wrap">
              <span className="material-symbols-outlined au-search-icon">search</span>
              <input
                className="au-search"
                placeholder="Search by name or email…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
              />
              {search && (
                <button className="au-search-clear" onClick={() => setSearch('')}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                </button>
              )}
            </div>

            <div className="au-filters">
              <select className="au-select" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }}>
                {ROLES.map(r => <option key={r} value={r}>{r === 'all' ? 'All Roles' : ROLE_META[r]?.label || r}</option>)}
              </select>
              <select className="au-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
                {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : STATUS_META[s]?.label || s}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="au-loading">
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>progress_activity</span>
            </div>
          ) : error ? (
            <div className="au-state-box card-base">
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--color-error)' }}>error_outline</span>
              <h3>{error}</h3>
              <button className="au-btn au-btn--primary" onClick={() => loadUsers(page)}>Try Again</button>
            </div>
          ) : users.length === 0 ? (
            <div className="au-state-box card-base">
              <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--color-outline)' }}>person_search</span>
              <h3>No users found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          ) : (
            <>
              <div className="au-table-wrap card-base">
                <table className="au-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Institution</th>
                      <th>Joined</th>
                      <th style={{ width: 80 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} className="au-table__row">
                        <td>
                          <div className="au-table__user">
                            <div className="au-table__avatar">
                              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person</span>
                            </div>
                            <div>
                              <p className="au-table__name">{u.name}</p>
                              <p className="au-table__email">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td><RoleBadge role={u.role} /></td>
                        <td><StatusBadge status={u.accountStatus || 'active'} /></td>
                        <td className="au-table__institution">{u.institution || '—'}</td>
                        <td className="au-table__date">{formatDate(u.createdAt)}</td>
                        <td>
                          <button
                            className="au-btn au-btn--icon"
                            onClick={() => setSelectedUser(u)}
                            title="View & Manage"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>manage_accounts</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="au-pagination">
                  <button className="au-btn au-btn--ghost" onClick={() => loadUsers(page - 1)} disabled={page <= 1}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
                  </button>
                  <span className="au-pagination__info">Page {page} of {totalPages}</span>
                  <button className="au-btn au-btn--ghost" onClick={() => loadUsers(page + 1)} disabled={page >= totalPages}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── APPROVALS TAB ── */}
      {tab === 'approvals' && (
        <div className="au-approvals">
          {approvals.length === 0 ? (
            <div className="au-state-box card-base">
              <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--color-success)' }}>check_circle</span>
              <h3>All caught up!</h3>
              <p>No pending registration requests at the moment.</p>
            </div>
          ) : (
            <>
              <p className="au-approvals__count">{approvals.length} pending request{approvals.length !== 1 ? 's' : ''}</p>
              {approvals.map(u => (
                <ApprovalCard
                  key={u._id}
                  user={u}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onVerifyViaStudent={handleVerifyViaStudent}
                  processing={processing}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <UserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onAction={handleModalAction}
        />
      )}
    </div>
  )
}
