import './AdminPages.css'

export default function AdminAIMonitoring() {
  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h2 className="admin-page__title">Cấu hình & Giám sát AI</h2>
          <p className="admin-page__subtitle">Cấu hình API Keys, điều chỉnh AI Prompts và theo dõi hiệu suất/chi phí hoạt động LLM</p>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card__header">
          <h3 className="admin-card__title">Nhiệm vụ phân công: NGƯỜI 3</h3>
          <p className="admin-card__desc">Phân hệ này đảm nhận việc tối ưu hóa chi phí AI, cấu hình model động và prompt hệ thống.</p>
        </div>
        
        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--color-surface-container-low)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--color-outline-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--color-outline)', marginBottom: '16px' }}>
            engineering
          </span>
          <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: '8px', color: 'var(--color-on-surface)' }}>Đang triển khai giao diện</h4>
          <p style={{ color: 'var(--color-on-surface-variant)', maxWidth: '500px', margin: '0 auto', fontSize: '14px', lineHeight: 1.5 }}>
            Nội dung bao gồm cấu hình các thông số hệ thống, biểu mẫu chỉnh sửa API Keys (Groq, OpenAI, Llama), cập nhật các Prompt hệ thống của AI và các biểu đồ thống kê token tiêu thụ, lượt gọi thành công/lỗi.
          </p>
        </div>
      </div>
    </div>
  )
}
