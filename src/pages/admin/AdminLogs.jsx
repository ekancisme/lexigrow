import { useState } from 'react'
import AdminAnalytics from './AdminAnalytics'
import AdminAuditLogs from './AdminAuditLogs'
import api from '../../services/api'
import './AdminPages.css'

export default function AdminLogs() {
  const [activeTab, setActiveTab] = useState('analytics')
  const [seeding, setSeeding] = useState(false)
  const [seedMessage, setSeedMessage] = useState('')

  async function handleSeedMockData() {
    setSeeding(true)
    setSeedMessage('')
    try {
      const res = await api.post('/admin/logs/seed')
      setSeedMessage(res.data.message || 'Khởi tạo dữ liệu mẫu thành công!')
      // Refresh page to load seeded data after 1.5 seconds
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err) {
      console.error(err)
      setSeedMessage('Có lỗi xảy ra khi tạo dữ liệu mẫu.')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page__header" style={{ borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '12px', marginBottom: '8px' }}>
        <div>
          <h2 className="admin-page__title">Nhật ký & Thống kê hệ thống</h2>
          <p className="admin-page__subtitle">Theo dõi tổng quan dữ liệu chấm điểm AI và lịch sử thao tác của giáo viên/admin</p>
        </div>

        {/* Mock Data Seeder Trigger */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <button
            onClick={handleSeedMockData}
            disabled={seeding}
            style={{
              padding: '8px 16px',
              background: seeding ? 'var(--color-surface-container-high)' : 'transparent',
              color: 'var(--color-primary)',
              border: '1.5px dashed var(--color-primary)',
              borderRadius: 'var(--radius-lg)',
              cursor: seeding ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {seeding ? 'autorenew' : 'database'}
            </span>
            {seeding ? 'Đang tạo dữ liệu mẫu...' : 'Tạo Dữ liệu Mẫu (Seed)'}
          </button>
          {seedMessage && (
            <p style={{ fontSize: '12px', color: seedMessage.includes('lỗi') ? 'var(--color-error)' : '#28a745', fontWeight: 600 }}>
              {seedMessage}
            </p>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-outline-variant)', gap: '24px' }}>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'analytics' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'analytics' ? 'var(--color-primary)' : 'var(--color-outline)',
            fontWeight: 700,
            fontSize: '15px',
            padding: '12px 6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>monitoring</span>
          Thống kê hoạt động
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'logs' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'logs' ? 'var(--color-primary)' : 'var(--color-outline)',
            fontWeight: 700,
            fontSize: '15px',
            padding: '12px 6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>receipt_long</span>
          Nhật ký hệ thống
        </button>
      </div>

      {/* Active Content */}
      <div style={{ marginTop: '16px' }}>
        {activeTab === 'analytics' ? <AdminAnalytics /> : <AdminAuditLogs />}
      </div>
    </div>
  )
}
