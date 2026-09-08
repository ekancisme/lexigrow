import { useState, useEffect } from 'react'
import paymentService from '../../services/payment.service.js'
import './AdminPricing.css'

export default function AdminPricing() {
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
      setMessage({ type: 'error', text: 'Không thể tải dữ liệu quản trị.' })
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
      setMessage({ type: 'success', text: `Đã cập nhật gói ${editingPlan.name} thành công!` })
      setEditingPlan(null)
      fetchTabData()
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Lỗi cập nhật gói cước.' })
    }
  }

  async function handleGrantSubscription(e) {
    e.preventDefault()
    try {
      await paymentService.adminGrantSubscription(grantData)
      setMessage({ type: 'success', text: 'Đã cấp gói cước cho người dùng thành công!' })
      setGrantModal(false)
      fetchTabData()
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Lỗi cấp gói cước.' })
    }
  }

  return (
    <div className="admin-pricing-page">
      {/* Header */}
      <div className="admin-pricing__header">
        <div>
          <h1 className="text-headline-md">Quản Lý Gói Cước & Doanh Thu PayOS</h1>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
            Điều chỉnh giá cước, hạn mức bảo trợ học sinh và theo dõi thanh toán tự động.
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
            <span>Cấp gói cước</span>
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
            <div className="text-label-md" style={{ color: 'var(--color-on-surface-variant)' }}>Tổng Doanh Thu PayOS</div>
            <div className="text-headline-sm" style={{ fontWeight: 800, color: '#16a34a' }}>
              {revenueStats.totalRevenue.toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>

        <div className="admin-pricing__kpi-card">
          <div className="admin-pricing__kpi-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <span className="material-symbols-outlined">receipt_long</span>
          </div>
          <div>
            <div className="text-label-md" style={{ color: 'var(--color-on-surface-variant)' }}>Đơn Hàng Đã Thanh Toán</div>
            <div className="text-headline-sm" style={{ fontWeight: 800 }}>
              {revenueStats.paidCount} đơn
            </div>
          </div>
        </div>

        <div className="admin-pricing__kpi-card">
          <div className="admin-pricing__kpi-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <span className="material-symbols-outlined">stars</span>
          </div>
          <div>
            <div className="text-label-md" style={{ color: 'var(--color-on-surface-variant)' }}>Gói Cước Đang Mở</div>
            <div className="text-headline-sm" style={{ fontWeight: 800 }}>
              {plans.filter((p) => p.isActive).length} / {plans.length} gói
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
          <span>Cấu hình Gói Cước</span>
        </button>
        <button
          type="button"
          className={`admin-pricing__tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <span className="material-symbols-outlined">receipt</span>
          <span>Lịch sử Giao Dịch PayOS</span>
        </button>
        <button
          type="button"
          className={`admin-pricing__tab ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          <span className="material-symbols-outlined">workspace_premium</span>
          <span>Gói Đang Hoạt Động</span>
        </button>
      </div>

      {/* TAB CONTENT: PLANS */}
      {activeTab === 'plans' && (
        <div className="admin-pricing__table-wrap">
          {loading ? (
            <div className="admin-pricing__loading">Đang tải danh sách gói cước...</div>
          ) : (
            <table className="admin-pricing__table">
              <thead>
                <tr>
                  <th>Tên Gói</th>
                  <th>Đối tượng</th>
                  <th>Tier</th>
                  <th>Giá Tháng</th>
                  <th>Giá Năm</th>
                  <th>Bảo trợ Học sinh</th>
                  <th>Badge</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p._id}>
                    <td><strong>{p.name}</strong> ({p.slug})</td>
                    <td>
                      <span className={`admin-pricing__role-pill ${p.targetRole}`}>
                        {p.targetRole === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                      </span>
                    </td>
                    <td><span className="admin-pricing__tier-tag">{p.tier.toUpperCase()}</span></td>
                    <td><strong>{p.monthlyPrice.toLocaleString('vi-VN')} đ</strong></td>
                    <td><strong>{p.yearlyPrice.toLocaleString('vi-VN')} đ</strong></td>
                    <td>
                      {p.targetRole === 'teacher' ? (
                        <span style={{ color: '#0284c7', fontWeight: 600 }}>{p.maxSponsoredStudents} học sinh</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td>{p.highlightBadge || <span style={{ color: '#94a3b8' }}>Không</span>}</td>
                    <td>
                      <span className={`admin-pricing__status-badge ${p.isActive ? 'active' : 'inactive'}`}>
                        {p.isActive ? 'Đang mở' : 'Tạm ẩn'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', borderRadius: 8 }}
                        onClick={() => setEditingPlan({ ...p })}
                      >
                        Chỉnh sửa
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
            <div className="admin-pricing__loading">Đang tải lịch sử giao dịch...</div>
          ) : transactions.length === 0 ? (
            <div className="admin-pricing__empty">Chưa có giao dịch PayOS nào.</div>
          ) : (
            <table className="admin-pricing__table">
              <thead>
                <tr>
                  <th>Mã Đơn</th>
                  <th>Người Mua</th>
                  <th>Gói Cước</th>
                  <th>Chu kỳ</th>
                  <th>Số Tiền</th>
                  <th>Trạng Thái</th>
                  <th>Thời Gian</th>
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
                    <td>{tx.billingCycle === 'yearly' ? '1 Năm' : '1 Tháng'}</td>
                    <td><strong style={{ color: '#16a34a' }}>{tx.amount.toLocaleString('vi-VN')} đ</strong></td>
                    <td>
                      <span className={`admin-pricing__status-badge ${tx.status.toLowerCase()}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td>{new Date(tx.createdAt).toLocaleString('vi-VN')}</td>
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
            <div className="admin-pricing__loading">Đang tải danh sách gói hoạt động...</div>
          ) : subscriptions.length === 0 ? (
            <div className="admin-pricing__empty">Chưa có gói cước nào được kích hoạt.</div>
          ) : (
            <table className="admin-pricing__table">
              <thead>
                <tr>
                  <th>Người Dùng</th>
                  <th>Vai Trò</th>
                  <th>Gói Cước</th>
                  <th>Tier</th>
                  <th>Ngày Bắt Đầu</th>
                  <th>Ngày Hết Hạn</th>
                  <th>Trạng Thái</th>
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
                    <td>{new Date(sub.startDate).toLocaleDateString('vi-VN')}</td>
                    <td><strong>{new Date(sub.endDate).toLocaleDateString('vi-VN')}</strong></td>
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
              <h3>Chỉnh Sửa Gói Cước: {editingPlan.name}</h3>
              <button type="button" onClick={() => setEditingPlan(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSavePlan} className="admin-pricing__form">
              <div className="admin-pricing__form-group">
                <label>Tên gói hiển thị</label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  required
                />
              </div>

              <div className="admin-pricing__form-row">
                <div className="admin-pricing__form-group">
                  <label>Giá theo Tháng (VNĐ)</label>
                  <input
                    type="number"
                    value={editingPlan.monthlyPrice}
                    onChange={(e) => setEditingPlan({ ...editingPlan, monthlyPrice: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-pricing__form-group">
                  <label>Giá theo Năm (VNĐ)</label>
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
                  <label>Hạn mức Học sinh được Bảo trợ</label>
                  <input
                    type="number"
                    value={editingPlan.maxSponsoredStudents}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxSponsoredStudents: e.target.value })}
                    required
                  />
                  <small style={{ color: 'var(--color-on-surface-variant)' }}>
                    Số lượng học sinh trong các lớp của giáo viên được dùng miễn phí.
                  </small>
                </div>
              )}

              <div className="admin-pricing__form-group">
                <label>Nhãn nổi bật (Badge)</label>
                <input
                  type="text"
                  placeholder="VD: Phổ biến nhất, Khuyên dùng"
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
                <label htmlFor="isActiveCheck" style={{ margin: 0, cursor: 'pointer' }}>Đang mở bán trên trang Bảng giá</label>
              </div>

              <div className="admin-pricing__modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setEditingPlan(null)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Lưu thay đổi
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
              <h3>Cấp Gói Cước Thủ Công Cho User</h3>
              <button type="button" onClick={() => setGrantModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleGrantSubscription} className="admin-pricing__form">
              <div className="admin-pricing__form-group">
                <label>User ID hoặc Email</label>
                <input
                  type="text"
                  placeholder="Nhập ID User (MongoDB ObjectId)"
                  value={grantData.userId}
                  onChange={(e) => setGrantData({ ...grantData, userId: e.target.value })}
                  required
                />
              </div>
              <div className="admin-pricing__form-group">
                <label>Chọn Gói cước</label>
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
                <label>Thời hạn cấp (Số ngày)</label>
                <input
                  type="number"
                  value={grantData.durationDays}
                  onChange={(e) => setGrantData({ ...grantData, durationDays: e.target.value })}
                  required
                />
              </div>
              <div className="admin-pricing__modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setGrantModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Cấp gói ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
