import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import './AdminPages.css'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { t, language } = useLanguage()

  const adminTasks = [
    {
      id: 'users',
      title: language === 'vi' ? 'Quản Lý Người Dùng' : 'User Management',
      desc: language === 'vi' ? 'Quản lý tài khoản, phân quyền (Học sinh, Giáo viên, Phụ huynh, Quản trị viên) và phê duyệt yêu cầu.' : 'Manage user profiles, role permissions (Student, Teacher, Parent, Admin), and approve registration requests.',
      badge: 'Admin',
      icon: 'group',
      path: '/admin/users',
    },
    {
      id: 'classes',
      title: language === 'vi' ? 'Quản Lý Lớp Học' : 'Class Management',
      desc: language === 'vi' ? 'Giám sát danh sách lớp toàn hệ thống, quản lý danh sách học sinh và luân chuyển lớp.' : 'Monitor global list of classes, manage class rosters, and transfer students between classes.',
      badge: 'Admin',
      icon: 'domain',
      path: '/admin/classes',
    },
    {
      id: 'ai-monitoring',
      title: language === 'vi' ? 'Cấu Hình & Giám Sát AI' : 'AI Config & Monitoring',
      desc: language === 'vi' ? 'Cấu hình khóa API cho các LLM (Groq, Llama, OpenAI), quản lý prompt và giám sát chi phí.' : 'Configure API keys for LLMs (Groq, Llama, OpenAI), manage prompts, and monitor AI logs and costs.',
      badge: 'Admin',
      icon: 'monitoring',
      path: '/admin/ai-monitoring',
    },
    {
      id: 'vocabulary',
      title: language === 'vi' ? 'Thư Viện Từ Vựng Chuẩn' : 'Standard Vocabulary Library',
      desc: language === 'vi' ? 'Quản lý từ vựng học thuật, cấp độ khó CEFR và nhập/xuất danh sách Excel/CSV.' : 'Manage global academic word lists, CEFR difficulty tiers, and import/export lists in Excel/CSV.',
      badge: 'Admin',
      icon: 'dictionary',
      path: '/admin/vocabulary',
    },
    {
      id: 'logs',
      title: language === 'vi' ? 'Nhật Ký Hệ Thống & Báo Cáo' : 'System Logs & Reports',
      desc: language === 'vi' ? 'Xem thống kê sử dụng tổng hợp và theo dõi lịch sử thay đổi của quản trị viên (Audit Logs).' : 'View aggregated usage stats and track administrator change history (Audit Logs).',
      badge: 'Admin',
      icon: 'receipt_long',
      path: '/admin/logs',
    },
  ]

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page__header">
        <div>
          <h2 className="admin-page__title">{t('adminDashboard.title', 'LexiGrow Administration System')}</h2>
          <p className="admin-page__subtitle">{t('adminDashboard.subtitle', 'Main Administration Dashboard')}</p>
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
            <p className="admin-stat-card__label">{t('adminDashboard.totalUsers', 'Total Users')}</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--green">
            <span className="material-symbols-outlined">domain</span>
          </div>
          <div>
            <p className="admin-stat-card__value">42</p>
            <p className="admin-stat-card__label">{t('adminDashboard.totalClasses', 'Total Classes')}</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--orange">
            <span className="material-symbols-outlined">analytics</span>
          </div>
          <div>
            <p className="admin-stat-card__value">15.2k</p>
            <p className="admin-stat-card__label">{t('adminDashboard.aiRequests', 'AI Requests (Monthly)')}</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--purple">
            <span className="material-symbols-outlined">menu_book</span>
          </div>
          <div>
            <p className="admin-stat-card__value">3,500</p>
            <p className="admin-stat-card__label">{t('adminDashboard.systemDict', 'System Dictionary')}</p>
          </div>
        </div>
      </div>

      {/* Action Modules */}
      <div className="admin-card">
        <div className="admin-card__header">
          <h3 className="admin-card__title">{t('adminDashboard.modulesTitle', 'Administrative Function Modules')}</h3>
          <p className="admin-card__desc">{t('adminDashboard.modulesDesc', 'LexiGrow administrative functional areas assigned to team members:')}</p>
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
                {t('adminDashboard.accessModule', 'Access Module')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
