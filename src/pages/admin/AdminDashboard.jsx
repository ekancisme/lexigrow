import { useNavigate } from 'react-router-dom'
import './AdminPages.css'

export default function AdminDashboard() {
  const navigate = useNavigate()

  const adminTasks = [
    {
      id: 'users',
      title: 'User Management',
      desc: 'Manage user profiles, role permissions (Student, Teacher, Parent, Admin), and approve registration requests.',
      badge: 'Person 1',
      icon: 'group',
      path: '/admin/users',
    },
    {
      id: 'classes',
      title: 'Class Management',
      desc: 'Monitor global list of classes, manage class rosters, and transfer students between classes.',
      badge: 'Person 2',
      icon: 'domain',
      path: '/admin/classes',
    },
    {
      id: 'ai-monitoring',
      title: 'AI Config & Monitoring',
      desc: 'Configure API keys for LLMs (Groq, Llama, OpenAI), manage prompts, and monitor AI logs and costs.',
      badge: 'Person 3',
      icon: 'monitoring',
      path: '/admin/ai-monitoring',
    },
    {
      id: 'vocabulary',
      title: 'Standard Vocabulary Library',
      desc: 'Manage global academic word lists, CEFR difficulty tiers, and import/export lists in Excel/CSV.',
      badge: 'Person 4',
      icon: 'dictionary',
      path: '/admin/vocabulary',
    },
    {
      id: 'logs',
      title: 'System Logs & Reports',
      desc: 'View aggregated usage stats and track administrator change history (Audit Logs).',
      badge: 'Person 5',
      icon: 'receipt_long',
      path: '/admin/logs',
    },
  ]

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page__header">
        <div>
          <h2 className="admin-page__title">LexiGrow Administration System</h2>
          <p className="admin-page__subtitle">Main Administration Dashboard</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="admin-page__stats">
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--blue">
            <span className="material-symbols-outlined">group</span>
          </div>
          <div>
            <p className="admin-stat-card__value">1,248</p>
            <p className="admin-stat-card__label">Total Users</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--green">
            <span className="material-symbols-outlined">domain</span>
          </div>
          <div>
            <p className="admin-stat-card__value">42</p>
            <p className="admin-stat-card__label">Total Classes</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--orange">
            <span className="material-symbols-outlined">analytics</span>
          </div>
          <div>
            <p className="admin-stat-card__value">15.2k</p>
            <p className="admin-stat-card__label">AI Requests (Monthly)</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--purple">
            <span className="material-symbols-outlined">menu_book</span>
          </div>
          <div>
            <p className="admin-stat-card__value">3,500</p>
            <p className="admin-stat-card__label">System Dictionary</p>
          </div>
        </div>
      </div>

      {/* Action Modules */}
      <div className="admin-card">
        <div className="admin-card__header">
          <h3 className="admin-card__title">Administrative Function Modules</h3>
          <p className="admin-card__desc">LexiGrow administrative functional areas assigned to team members:</p>
        </div>

        <div className="admin-tasks-grid">
          {adminTasks.map((task) => (
            <div key={task.id} className="admin-task-item">
              <div className="admin-task-item__header">
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--color-primary)' }}>
                  {task.icon}
                </span>
                <span className="admin-task-item__badge admin-task-item__badge--blue">{task.badge}</span>
              </div>
              <h4 className="admin-task-item__title">{task.title}</h4>
              <p className="admin-task-item__desc">{task.desc}</p>
              <button className="admin-task-item__btn" onClick={() => navigate(task.path)}>
                Access Module
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
