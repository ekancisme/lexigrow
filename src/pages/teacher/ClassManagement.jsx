import { useState } from 'react'
import './ClassManagement.css'

const classList = [
  { id: 1, name: 'English 101 - Advanced', students: 22, schedule: 'Mon, Wed, Fri', status: 'active' },
  { id: 2, name: 'Creative Writing II', students: 18, schedule: 'Tue, Thu', status: 'active' },
  { id: 3, name: 'Linguistics Intro', students: 45, schedule: 'Mon, Wed', status: 'active' },
  { id: 4, name: 'Business English', students: 15, schedule: 'Fri', status: 'draft' },
]

export default function ClassManagement() {
  const [showModal, setShowModal] = useState(false)
  return (
    <div className="class-mgmt">
      <section className="class-mgmt__header">
        <div>
          <h2 className="text-headline-lg">Class Management</h2>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>Create, edit, and manage your classes and student rosters</p>
        </div>
        <button className="class-mgmt__create-btn" onClick={() => setShowModal(true)}>
          <span className="material-symbols-outlined">add</span> Create New Class
        </button>
      </section>

      <div className="class-mgmt__grid">
        {classList.map(cls => (
          <div key={cls.id} className="class-mgmt__card card-base">
            <div className="class-mgmt__card-header">
              <h3 className="text-title-lg">{cls.name}</h3>
              <span className={`class-mgmt__badge class-mgmt__badge--${cls.status}`}>{cls.status}</span>
            </div>
            <div className="class-mgmt__card-details">
              <div className="class-mgmt__detail"><span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-outline)' }}>group</span><span className="text-label-md">{cls.students} Students</span></div>
              <div className="class-mgmt__detail"><span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-outline)' }}>schedule</span><span className="text-label-md">{cls.schedule}</span></div>
            </div>
            <div className="class-mgmt__card-actions">
              <button className="class-mgmt__edit-btn">Edit</button>
              <button className="class-mgmt__view-btn">View Roster</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="class-mgmt__modal-overlay" onClick={() => setShowModal(false)}>
          <div className="class-mgmt__modal card-base" onClick={e => e.stopPropagation()}>
            <h3 className="text-headline-md" style={{ marginBottom: 20 }}>Create New Class</h3>
            <div className="class-mgmt__form-field">
              <label className="text-label-md">Class Name</label>
              <input type="text" placeholder="e.g., English 201" className="class-mgmt__input" />
            </div>
            <div className="class-mgmt__form-field">
              <label className="text-label-md">Description</label>
              <textarea placeholder="Brief description..." className="class-mgmt__textarea" rows={3} />
            </div>
            <div className="class-mgmt__form-field">
              <label className="text-label-md">Schedule</label>
              <input type="text" placeholder="e.g., Mon, Wed, Fri" className="class-mgmt__input" />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="class-mgmt__cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="class-mgmt__submit-btn" onClick={() => setShowModal(false)}>Create Class</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
