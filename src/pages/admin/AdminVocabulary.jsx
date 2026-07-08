import './AdminPages.css'

export default function AdminVocabulary() {
  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h2 className="admin-page__title">Từ vựng học thuật</h2>
          <p className="admin-page__subtitle">Quản trị kho từ điển chuẩn hệ thống, cấp độ CEFR và phân loại AWL</p>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card__header">
          <h3 className="admin-card__title">Nhiệm vụ phân công: NGƯỜI 4</h3>
          <p className="admin-card__desc">Phân hệ này đảm nhận việc đồng bộ hóa dữ liệu từ vựng và xử lý nhập/xuất file hàng loạt.</p>
        </div>
        
        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--color-surface-container-low)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--color-outline-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--color-outline)', marginBottom: '16px' }}>
            engineering
          </span>
          <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: '8px', color: 'var(--color-on-surface)' }}>Đang triển khai giao diện</h4>
          <p style={{ color: 'var(--color-on-surface-variant)', maxWidth: '500px', margin: '0 auto', fontSize: '14px', lineHeight: 1.5 }}>
            Nội dung bao gồm bảng điều khiển danh mục từ vựng học thuật hệ thống, tính năng tìm kiếm và lọc từ theo CEFR (A1-C2) hay AWL, cùng công cụ nhập/xuất từ điển qua định dạng Excel/CSV.
          </p>
        </div>
      </div>
    </div>
  )
}
