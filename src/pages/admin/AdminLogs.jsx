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
      setSeedMessage(res.message || 'Mock data seeded successfully!')
      // Refresh page to load seeded data after 1.5 seconds
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err) {
      console.error(err)
      setSeedMessage('An error occurred while seeding mock data.')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page__header" style={{ borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '12px', marginBottom: '8px' }}>
        <div>
          <h2 className="admin-page__title">System Logs & Reports</h2>
          <p className="admin-page__subtitle">Monitor system activities, admin actions, and LLM rating analytics</p>
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
            {seeding ? 'Seeding mock data...' : 'Seed Mock Data'}
          </button>
          {seedMessage && (
            <p style={{ fontSize: '12px', color: seedMessage.includes('error') ? 'var(--color-error)' : '#28a745', fontWeight: 600 }}>
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
          Activity Analytics
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
          System Audit Logs
        </button>
      </div>

      {/* Active Content */}
      <div style={{ marginTop: '16px' }}>
        {activeTab === 'analytics' ? <AdminAnalytics /> : <AdminAuditLogs />}
      </div>
    </div>
  )
}
