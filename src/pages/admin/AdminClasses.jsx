import './AdminPages.css'
export default function AdminClasses() {
  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h2 className="admin-page__title">Class Management</h2>
          <p className="admin-page__subtitle">Manage system-wide class lists and student roster transfers</p>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card__header">
          <h3 className="admin-card__title">Assigned Module: Person 2</h3>
          <p className="admin-card__desc">This module handles teacher class supervision and roster/student adjustments.</p>
        </div>

        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--color-surface-container-low)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--color-outline-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--color-outline)', marginBottom: '16px' }}>
            engineering
          </span>
          <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: '8px', color: 'var(--color-on-surface)' }}>Under Development</h4>
          <p style={{ color: 'var(--color-on-surface-variant)', maxWidth: '500px', margin: '0 auto', fontSize: '14px', lineHeight: 1.5 }}>
            Features include viewing current classes, student count, assigned teachers, archive options, and student transfer forms.
          </p>
        </div>
      </div>
    </div>
  )
}
