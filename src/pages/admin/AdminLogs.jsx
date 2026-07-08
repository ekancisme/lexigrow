import './AdminPages.css'

export default function AdminLogs() {
  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h2 className="admin-page__title">Nhật ký & Thống kê hệ thống</h2>
          <p className="admin-page__subtitle">Theo dõi lịch sử thao tác của các quản trị viên/giáo viên và thống kê chỉ số hoạt động</p>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card__header">
          <h3 className="admin-card__title">Nhiệm vụ phân công: NGƯỜI 5</h3>
          <p className="admin-card__desc">Phân hệ này đảm nhận việc giám sát và lập báo cáo hoạt động hệ thống chi tiết.</p>
        </div>
        
        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--color-surface-container-low)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--color-outline-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--color-outline)', marginBottom: '16px' }}>
            engineering
          </span>
          <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: '8px', color: 'var(--color-on-surface)' }}>Đang triển khai giao diện</h4>
          <p style={{ color: 'var(--color-on-surface-variant)', maxWidth: '500px', margin: '0 auto', fontSize: '14px', lineHeight: 1.5 }}>
            Nội dung bao gồm biểu đồ thống kê tăng trưởng người dùng và hoạt động viết bài toàn hệ thống, kết hợp với bảng danh sách nhật ký hành động (Audit Logs) hỗ trợ tìm kiếm, lọc theo người dùng và loại hành động.
          </p>
        </div>
      </div>
    </div>
  )
}
