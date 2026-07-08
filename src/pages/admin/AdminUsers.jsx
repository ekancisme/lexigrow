import './AdminPages.css'

export default function AdminUsers() {
  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h2 className="admin-page__title">Quản lý Người dùng</h2>
          <p className="admin-page__subtitle">Giao diện quản trị, phê duyệt tài khoản và phân quyền người dùng hệ thống</p>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card__header">
          <h3 className="admin-card__title">Nhiệm vụ phân công: NGƯỜI 1</h3>
          <p className="admin-card__desc">Phân hệ này đảm nhận toàn bộ luồng quản lý người dùng và duyệt tài khoản đăng ký giáo viên/phụ huynh.</p>
        </div>
        
        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--color-surface-container-low)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--color-outline-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--color-outline)', marginBottom: '16px' }}>
            engineering
          </span>
          <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: '8px', color: 'var(--color-on-surface)' }}>Đang triển khai giao diện</h4>
          <p style={{ color: 'var(--color-on-surface-variant)', maxWidth: '500px', margin: '0 auto', fontSize: '14px', lineHeight: 1.5 }}>
            Nội dung bao gồm bảng dữ liệu CRUD User, bộ lọc nâng cao, nút thay đổi trạng thái tài khoản (Active, Suspended, Pending) và tab phê duyệt đăng ký của Giáo viên/Phụ huynh.
          </p>
        </div>
      </div>
    </div>
  )
}
