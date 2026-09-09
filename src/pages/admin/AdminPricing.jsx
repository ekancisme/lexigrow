import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import paymentService from '../../services/payment.service.js'
import './AdminPricing.css'

export default function AdminPricing() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('plans') // 'plans' | 'transactions' | 'subscriptions'
  const [plans, setPlans] = useState([])
  const [transactions, setTransactions] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [revenueStats, setRevenueStats] = useState({ totalRevenue: 0, paidCount: 0 })
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [grantModal, setGrantModal] = useState(false)
  const [grantData, setGrantData] = useState({ userId: '', planSlug: 'student-pro', durationDays: 30 })

  useEffect(() => {
    fetchTabData()
  }, [activeTab])

  async function fetchTabData() {
    try {
      setLoading(true)
      if (activeTab === 'plans') {
        const res = await paymentService.adminGetPlans()
        setPlans(res.data || [])
      } else if (activeTab === 'transactions') {
        const res = await paymentService.adminGetTransactions()
        setTransactions(res.data || [])
        setRevenueStats({
          totalRevenue: res.totalRevenue || 0,
          paidCount: res.paidCount || 0,
        })
      } else if (activeTab === 'subscriptions') {
        const res = await paymentService.adminGetSubscriptions()
        setSubscriptions(res.data || [])
      }
    } catch (err) {
      console.error('Error fetching admin pricing data:', err)
      setMessage({ type: 'error', text: 'Unable to load admin pricing data.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSavePlan(e) {
    e.preventDefault()
    if (!editingPlan) return

    try {
      await paymentService.adminUpdatePlan(editingPlan._id, {
        name: editingPlan.name,
        monthlyPrice: Number(editingPlan.monthlyPrice),
        yearlyPrice: Number(editingPlan.yearlyPrice),
        maxSponsoredStudents: Number(editingPlan.maxSponsoredStudents || 0),
        dailyAiEssayLimit: Number(editingPlan.dailyAiEssayLimit || 3),
        highlightBadge: editingPlan.highlightBadge || '',
        isActive: editingPlan.isActive,
      })
      setMessage({ type: 'success', text: `Successfully updated plan ${editingPlan.name}!` })
      setEditingPlan(null)
      fetchTabData()
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error updating pricing plan.' })
    }
  }

  async function handleGrantSubscription(e) {
    e.preventDefault()
    try {
      await paymentService.adminGrantSubscription(grantData)
      setMessage({ type: 'success', text: 'Successfully granted subscription to user!' })
      setGrantModal(false)
      fetchTabData()
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error granting subscription.' })
    }
  }

  return (
    <div className="admin-pricing-page">
      {/* Header */}
      <div className="admin-pricing__header">
        <div>
          <h1 className="text-headline-md">{t('adminPricing.title', 'Pricing & PayOS Revenue Management')}</h1>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
            {t('adminPricing.subtitle', 'Configure pricing plans, teacher student sponsorship limits, and monitor automated transactions.')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', borderRadius: 10 }}
            onClick={() => setGrantModal(true)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>card_membership</span>
            <span>{t('adminPricing.grantSubscription', 'Grant Subscription')}</span>
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`admin-pricing__alert admin-pricing__alert--${message.type}`}>
          <span className="material-symbols-outlined">
            {message.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{message.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="admin-pricing__kpis">
        <div className="admin-pricing__kpi-card">
          <div className="admin-pricing__kpi-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <span className="material-symbols-outlined">payments</span>
          </div>
          <div>
            <div className="text-label-md" style={{ color: 'var(--color-on-surface-variant)' }}>Total PayOS Revenue</div>
            <div className="text-headline-sm" style={{ fontWeight: 800, color: '#16a34a' }}>
              {revenueStats.totalRevenue.toLocaleString('en-US')} VND
            </div>
          </div>
        </div>

        <div className="admin-pricing__kpi-card">
          <div className="admin-pricing__kpi-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <span className="material-symbols-outlined">receipt_long</span>
          </div>
          <div>
            <div className="text-label-md" style={{ color: 'var(--color-on-surface-variant)' }}>Paid Orders</div>
            <div className="text-headline-sm" style={{ fontWeight: 800 }}>
              {revenueStats.paidCount} orders
            </div>
          </div>
        </div>

        <div className="admin-pricing__kpi-card">
          <div className="admin-pricing__kpi-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <span className="material-symbols-outlined">stars</span>
          </div>
          <div>
            <div className="text-label-md" style={{ color: 'var(--color-on-surface-variant)' }}>Active Plans</div>
            <div className="text-headline-sm" style={{ fontWeight: 800 }}>
              {plans.filter((p) => p.isActive).length} / {plans.length} plans
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-pricing__tabs">
        <button
          type="button"
          className={`admin-pricing__tab ${activeTab === 'plans' ? 'active' : ''}`}
          onClick={() => setActiveTab('plans')}
        >
          <span className="material-symbols-outlined">tune</span>
          <span>{t('adminPricing.plansTab', 'Active Plans')}</span>
        </button>
        <button
          type="button"
          className={`admin-pricing__tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <span className="material-symbols-outlined">receipt</span>
          <span>{t('adminPricing.txTab', 'Transaction History')}</span>
        </button>
        <button
          type="button"
          className={`admin-pricing__tab ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          <span className="material-symbols-outlined">workspace_premium</span>
          <span>{t('adminPricing.subsTab', 'Active Subscriptions')}</span>
        </button>
      </div>

      {/* TAB CONTENT: PLANS */}
      {activeTab === 'plans' && (
        <div className="admin-pricing__table-wrap">
          {loading ? (
            <div className="admin-pricing__loading">Loading pricing plans...</div>
          ) : (
            <table className="admin-pricing__table">
              <thead>
                <tr>
                  <th>Plan Name</th>
                  <th>Target Role</th>
                  <th>Tier</th>
                  <th>Monthly Price</th>
                  <th>Yearly Price</th>
                  <th>Student Sponsorship</th>
                  <th>Badge</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p._id}>
                    <td><strong>{p.name}</strong> ({p.slug})</td>
                    <td>
                      <span className={`admin-pricing__role-pill ${p.targetRole}`}>
                        {p.targetRole === 'teacher' ? 'Teacher' : 'Student'}
                      </span>
                    </td>
                    <td><span className="admin-pricing__tier-tag">{p.tier.toUpperCase()}</span></td>
                    <td><strong>{p.monthlyPrice.toLocaleString('en-US')} VND</strong></td>
                    <td><strong>{p.yearlyPrice.toLocaleString('en-US')} VND</strong></td>
                    <td>
                      {p.targetRole === 'teacher' ? (
                        <span style={{ color: '#0284c7', fontWeight: 600 }}>{p.maxSponsoredStudents} students</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td>{p.highlightBadge || <span style={{ color: '#94a3b8' }}>None</span>}</td>
                    <td>
                      <span className={`admin-pricing__status-badge ${p.isActive ? 'active' : 'inactive'}`}>
                        {p.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', borderRadius: 8 }}
                        onClick={() => setEditingPlan({ ...p })}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB CONTENT: TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="admin-pricing__table-wrap">
          {loading ? (
            <div className="admin-pricing__loading">Loading transaction history...</div>
          ) : transactions.length === 0 ? (
            <div className="admin-pricing__empty">No PayOS transactions recorded yet.</div>
          ) : (
            <table className="admin-pricing__table">
              <thead>
                <tr>
                  <th>Order Code</th>
                  <th>Customer</th>
                  <th>Plan</th>
                  <th>Cycle</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx._id}>
                    <td><code>#{tx.orderCode}</code></td>
                    <td>
                      <div><strong>{tx.user?.name || 'N/A'}</strong></div>
                      <small style={{ color: 'var(--color-on-surface-variant)' }}>{tx.user?.email}</small>
                    </td>
                    <td>{tx.planName}</td>
                    <td>{tx.billingCycle === 'yearly' ? '1 Year' : '1 Month'}</td>
                    <td><strong style={{ color: '#16a34a' }}>{tx.amount.toLocaleString('en-US')} VND</strong></td>
                    <td>
                      <span className={`admin-pricing__status-badge ${tx.status.toLowerCase()}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td>{new Date(tx.createdAt).toLocaleString('en-US')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB CONTENT: SUBSCRIPTIONS */}
      {activeTab === 'subscriptions' && (
        <div className="admin-pricing__table-wrap">
          {loading ? (
            <div className="admin-pricing__loading">Loading active subscriptions...</div>
          ) : subscriptions.length === 0 ? (
            <div className="admin-pricing__empty">No active subscriptions found.</div>
          ) : (
            <table className="admin-pricing__table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Plan</th>
                  <th>Tier</th>
                  <th>Start Date</th>
                  <th>Expiration Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub._id}>
                    <td>
                      <div><strong>{sub.user?.name}</strong></div>
                      <small style={{ color: 'var(--color-on-surface-variant)' }}>{sub.user?.email}</small>
                    </td>
                    <td>{sub.targetRole}</td>
                    <td>{sub.plan?.name || sub.planSlug}</td>
                    <td><span className="admin-pricing__tier-tag">{sub.tier.toUpperCase()}</span></td>
                    <td>{new Date(sub.startDate).toLocaleDateString('en-US')}</td>
                    <td><strong>{new Date(sub.endDate).toLocaleDateString('en-US')}</strong></td>
                    <td>
                      <span className={`admin-pricing__status-badge ${sub.status}`}>
                        {sub.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* EDIT PLAN MODAL */}
      {editingPlan && (
        <div className="admin-pricing__modal-backdrop" onClick={() => setEditingPlan(null)}>
          <div className="admin-pricing__modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-pricing__modal-head">
              <h3>Edit Pricing Plan: {editingPlan.name}</h3>
              <button type="button" onClick={() => setEditingPlan(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSavePlan} className="admin-pricing__form">
              <div className="admin-pricing__form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  required
                />
              </div>

              <div className="admin-pricing__form-row">
                <div className="admin-pricing__form-group">
                  <label>Monthly Price (VND)</label>
                  <input
                    type="number"
                    value={editingPlan.monthlyPrice}
                    onChange={(e) => setEditingPlan({ ...editingPlan, monthlyPrice: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-pricing__form-group">
                  <label>Yearly Price (VND)</label>
                  <input
                    type="number"
                    value={editingPlan.yearlyPrice}
                    onChange={(e) => setEditingPlan({ ...editingPlan, yearlyPrice: e.target.value })}
                    required
                  />
                </div>
              </div>

              {editingPlan.targetRole === 'teacher' && (
                <div className="admin-pricing__form-group">
                  <label>Sponsored Student Limit</label>
                  <input
                    type="number"
                    value={editingPlan.maxSponsoredStudents}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxSponsoredStudents: e.target.value })}
                    required
                  />
                  <small style={{ color: 'var(--color-on-surface-variant)' }}>
                    Number of students across teacher classes who receive free access.
                  </small>
                </div>
              )}

              <div className="admin-pricing__form-group">
                <label>Highlight Badge</label>
                <input
                  type="text"
                  placeholder="e.g. Most Popular, Recommended"
                  value={editingPlan.highlightBadge || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, highlightBadge: e.target.value })}
                />
              </div>

              <div className="admin-pricing__form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={editingPlan.isActive}
                  onChange={(e) => setEditingPlan({ ...editingPlan, isActive: e.target.checked })}
                />
                <label htmlFor="isActiveCheck" style={{ margin: 0, cursor: 'pointer' }}>Available for purchase on Pricing page</label>
              </div>

              <div className="admin-pricing__modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setEditingPlan(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRANT SUBSCRIPTION MODAL */}
      {grantModal && (
        <div className="admin-pricing__modal-backdrop" onClick={() => setGrantModal(false)}>
          <div className="admin-pricing__modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-pricing__modal-head">
              <h3>Grant Subscription Manually</h3>
              <button type="button" onClick={() => setGrantModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleGrantSubscription} className="admin-pricing__form">
              <div className="admin-pricing__form-group">
                <label>User ID or Email</label>
                <input
                  type="text"
                  placeholder="Enter User ID (MongoDB ObjectId)"
                  value={grantData.userId}
                  onChange={(e) => setGrantData({ ...grantData, userId: e.target.value })}
                  required
                />
              </div>
              <div className="admin-pricing__form-group">
                <label>Select Plan</label>
                <select
                  value={grantData.planSlug}
                  onChange={(e) => setGrantData({ ...grantData, planSlug: e.target.value })}
                >
                  {plans.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name} ({p.targetRole})
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-pricing__form-group">
                <label>Duration (Days)</label>
                <input
                  type="number"
                  value={grantData.durationDays}
                  onChange={(e) => setGrantData({ ...grantData, durationDays: e.target.value })}
                  required
                />
              </div>
              <div className="admin-pricing__modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setGrantModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Grant Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
