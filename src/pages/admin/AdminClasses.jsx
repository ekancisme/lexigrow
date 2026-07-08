import './AdminPages.css'
export default function AdminClasses() {
  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h2 className="admin-page__title">Quản lý Lớp học</h2>
          <p className="admin-page__subtitle">Quản lý danh sách lớp học toàn hệ thống và điều chuyển học sinh</p>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card__header">
          <h3 className="admin-card__title">Nhiệm vụ phân công: NGƯỜI 2</h3>
          <p className="admin-card__desc">Phân hệ này đảm nhận việc giám sát lớp học của giáo viên và quyền can thiệp sỉ số, học viên.</p>
        </div>

        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--color-surface-container-low)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--color-outline-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--color-outline)', marginBottom: '16px' }}>
            engineering
          </span>
          <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: '8px', color: 'var(--color-on-surface)' }}>Đang triển khai giao diện</h4>
          <p style={{ color: 'var(--color-on-surface-variant)', maxWidth: '500px', margin: '0 auto', fontSize: '14px', lineHeight: 1.5 }}>
            Nội dung bao gồm giao diện xem danh sách các lớp học hiện tại, sĩ số học sinh, thông tin giáo viên phụ trách, nút đóng/lưu trữ lớp học và biểu mẫu chuyển học sinh giữa các lớp.
          </p>
        </div>
      </div>
    </div>
  )
}
