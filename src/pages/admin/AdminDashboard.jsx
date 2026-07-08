import { useNavigate } from 'react-router-dom'
import './AdminPages.css'

export default function AdminDashboard() {
  const navigate = useNavigate()

  const adminTasks = [
    {
      id: 'users',
      title: 'Quản lý người dùng',
      desc: 'Quản lý thông tin tài khoản, phân quyền vai trò (Học sinh, Giáo viên, Phụ huynh, Admin) và phê duyệt các yêu cầu đăng ký mới trong hệ thống.',
      badge: 'Người 1',
      icon: 'group',
      path: '/admin/users',
    },
    {
      id: 'classes',
      title: 'Quản lý lớp học hệ thống',
      desc: 'Theo dõi toàn bộ danh sách lớp học của các giáo viên, quản lý danh sách thành viên học sinh và thực hiện điều chuyển học sinh giữa các lớp.',
      badge: 'Người 2',
      icon: 'domain',
      path: '/admin/classes',
    },
    {
      id: 'ai-monitoring',
      title: 'Cấu hình & Giám sát AI',
      desc: 'Thiết lập API Keys cho các LLM (Groq, Llama, OpenAI), tinh chỉnh Prompts hệ thống chung và theo dõi lưu lượng, chi phí, tỷ lệ lỗi API.',
      badge: 'Người 3',
      icon: 'monitoring',
      path: '/admin/ai-monitoring',
    },
    {
      id: 'vocabulary',
      title: 'Thư viện Từ vựng chuẩn',
      desc: 'Quản lý danh mục từ vựng học thuật hệ thống, thiết lập độ khó CEFR, phân loại AWL và thực hiện nhập/xuất từ vựng hàng loạt từ file Excel/CSV.',
      badge: 'Người 4',
      icon: 'dictionary',
      path: '/admin/vocabulary',
    },
    {
      id: 'logs',
      title: 'Nhật ký & Thống kê hệ thống',
      desc: 'Xem báo cáo hoạt động tổng hợp của toàn hệ thống (bài viết, tương tác) và truy xuất lịch sử thay đổi/hành vi quản trị viên (Audit Logs).',
      badge: 'Người 5',
      icon: 'receipt_long',
      path: '/admin/logs',
    },
  ]

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page__header">
        <div>
          <h2 className="admin-page__title">Hệ thống Quản trị LexiGrow</h2>
          <p className="admin-page__subtitle">Bảng điều khiển chung dành cho Quản trị viên (Super Admin)</p>
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
            <p className="admin-stat-card__label">Tổng người dùng</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--green">
            <span className="material-symbols-outlined">domain</span>
          </div>
          <div>
            <p className="admin-stat-card__value">42</p>
            <p className="admin-stat-card__label">Tổng lớp học</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--orange">
            <span className="material-symbols-outlined">analytics</span>
          </div>
          <div>
            <p className="admin-stat-card__value">15.2k</p>
            <p className="admin-stat-card__label">Yêu cầu AI (Tháng)</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--purple">
            <span className="material-symbols-outlined">menu_book</span>
          </div>
          <div>
            <p className="admin-stat-card__value">3,500</p>
            <p className="admin-stat-card__label">Từ điển hệ thống</p>
          </div>
        </div>
      </div>

      {/* Action Modules */}
      <div className="admin-card">
        <div className="admin-card__header">
          <h3 className="admin-card__title">Phân hệ chức năng Quản trị</h3>
          <p className="admin-card__desc">Các chức năng quản trị hệ thống LexiGrow được phân công cho 5 thành viên nhóm:</p>
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
                Truy cập ngay
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
