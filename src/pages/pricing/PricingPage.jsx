import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import paymentService from '../../services/payment.service.js'
import './PricingPage.css'

export default function PricingPage() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [billingCycle, setBillingCycle] = useState('monthly') // 'monthly' | 'yearly'
  const [activeTab, setActiveTab] = useState(user?.role === 'teacher' ? 'teacher' : 'student')
  const [plans, setPlans] = useState([])
  const [currentTierInfo, setCurrentTierInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processingSlug, setProcessingSlug] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const resPlans = await paymentService.getPlans()
      setPlans(resPlans.data || [])

      if (isAuthenticated) {
        const resTier = await paymentService.getMySubscription()
        setCurrentTierInfo(resTier.data || null)
      }
    } catch (err) {
      console.error('Error loading pricing data:', err)
      setError('Không thể tải danh sách gói cước. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubscribe(planSlug) {
    if (!isAuthenticated) {
      navigate('/login', { state: { infoMessage: 'Vui lòng đăng nhập để nâng cấp gói cước.' } })
      return
    }

    try {
      setProcessingSlug(planSlug)
      setError('')
      const res = await paymentService.createPaymentLink(planSlug, billingCycle)
      if (res.data?.checkoutUrl) {
        // Redirect to PayOS VietQR payment page
        window.location.href = res.data.checkoutUrl
      } else {
        setError('Không nhận được link thanh toán từ PayOS. Vui lòng thử lại.')
      }
    } catch (err) {
      setError(err.message || 'Lỗi tạo liên kết thanh toán PayOS.')
    } finally {
      setProcessingSlug(null)
    }
  }

  const studentPlans = plans.filter((p) => p.targetRole === 'student')
  const teacherPlans = plans.filter((p) => p.targetRole === 'teacher')

  return (
    <div className="pricing-page">
      {/* Header Banner */}
      <section className="pricing__header">
        <div className="pricing__badge">
          <span className="material-symbols-outlined">verified</span>
          <span>Thanh toán tự động 24/7 qua VietQR PayOS</span>
        </div>
        <h1 className="pricing__title">Nâng Tầm Tiếng Anh Cùng LexiGrow AI</h1>
        <p className="pricing__subtitle">
          Chấm luận chuyên sâu chuẩn IELTS, mở khóa toàn bộ Vườn Tri Thức và gia tốc phản xạ ngôn ngữ.
        </p>

        {/* Current Tier Alert if user is subscribed or sponsored */}
        {currentTierInfo && currentTierInfo.tier !== 'free' && (
          <div className="pricing__current-tier-alert">
            <span className="material-symbols-outlined">workspace_premium</span>
            <div>
              <strong>Gói hiện tại của bạn: </strong>
              <span className="pricing__tier-tag">{currentTierInfo.tier.toUpperCase()}</span>
              {currentTierInfo.source === 'teacher_sponsored' && (
                <span> ({currentTierInfo.planName})</span>
              )}
              {currentTierInfo.expiresAt && (
                <span className="pricing__expire-text">
                  {' '}— Hết hạn: {new Date(currentTierInfo.expiresAt).toLocaleDateString('vi-VN')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Target Audience Tabs */}
        <div className="pricing__role-tabs">
          <button
            type="button"
            className={`pricing__role-tab ${activeTab === 'student' ? 'active' : ''}`}
            onClick={() => setActiveTab('student')}
          >
            <span className="material-symbols-outlined">school</span>
            <span>Dành cho Học sinh / Cá nhân</span>
          </button>
          <button
            type="button"
            className={`pricing__role-tab ${activeTab === 'teacher' ? 'active' : ''}`}
            onClick={() => setActiveTab('teacher')}
          >
            <span className="material-symbols-outlined">co_present</span>
            <span>Dành cho Giáo viên & Trung tâm</span>
          </button>
        </div>

        {/* Billing Cycle Switcher */}
        <div className="pricing__cycle-toggle-wrap">
          <span className={billingCycle === 'monthly' ? 'active' : ''}>Hàng tháng</span>
          <button
            type="button"
            className={`pricing__toggle-btn ${billingCycle === 'yearly' ? 'yearly' : ''}`}
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            aria-label="Chuyển chu kỳ thanh toán"
          >
            <div className="pricing__toggle-knob" />
          </button>
          <span className={billingCycle === 'yearly' ? 'active' : ''}>
            Hàng năm <span className="pricing__discount-pill">Tiết kiệm ~20%</span>
          </span>
        </div>
      </section>

      {error && (
        <div className="pricing__error-alert">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Teacher Sponsorship Benefit Notice */}
      {activeTab === 'teacher' && (
        <div className="pricing__teacher-notice">
          <span className="material-symbols-outlined">diversity_3</span>
          <div>
            <strong>Đặc quyền Bảo trợ Học sinh của Giáo viên:</strong>
            <p>
              Khi thầy cô đăng ký gói cước Giáo viên, toàn bộ học sinh trong các lớp của thầy cô sẽ được{' '}
              <strong>mở khóa tính năng cao cấp hoàn toàn miễn phí</strong> theo hạn mức học sinh của gói!
            </p>
          </div>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <section className="pricing__grid">
        {loading ? (
          <div className="pricing__loading">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            <p>Đang tải bảng giá dịch vụ...</p>
          </div>
        ) : activeTab === 'student' ? (
          <>
            {/* FREE PLAN */}
            <div className="pricing__card">
              <div className="pricing__card-head">
                <h3 className="pricing__card-name">Miễn Phí</h3>
                <p className="pricing__card-desc">Bắt đầu làm quen với phương pháp học từ vựng ngữ cảnh.</p>
                <div className="pricing__price-box">
                  <span className="pricing__price">0đ</span>
                  <span className="pricing__period">/ trọn đời</span>
                </div>
              </div>
              <ul className="pricing__features-list">
                <li><span className="material-symbols-outlined check">check_circle</span> 3 bài chấm & sửa luận AI mỗi ngày</li>
                <li><span className="material-symbols-outlined check">check_circle</span> Tham gia tối đa 1 lớp học</li>
                <li><span className="material-symbols-outlined check">check_circle</span> Học 3 bộ từ vựng cơ bản</li>
                <li><span className="material-symbols-outlined check">check_circle</span> Ôn tập Flashcard SRS tiêu chuẩn</li>
              </ul>
              <button type="button" className="pricing__btn pricing__btn--outline" disabled>
                {currentTierInfo?.tier === 'free' ? 'Đang sử dụng' : 'Gói mặc định'}
              </button>
            </div>

            {/* DYNAMIC STUDENT PLANS */}
            {studentPlans.map((plan) => {
              const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
              const formattedPrice = price.toLocaleString('vi-VN')
              const isCurrent = currentTierInfo?.tier === plan.tier && currentTierInfo?.source === 'personal_subscription'
              const isPopular = plan.tier === 'pro' || !!plan.highlightBadge

              return (
                <div key={plan.slug} className={`pricing__card ${isPopular ? 'popular' : ''}`}>
                  {plan.highlightBadge && (
                    <div className="pricing__popular-badge">{plan.highlightBadge}</div>
                  )}
                  <div className="pricing__card-head">
                    <h3 className="pricing__card-name">{plan.name}</h3>
                    <p className="pricing__card-desc">{plan.description}</p>
                    <div className="pricing__price-box">
                      <span className="pricing__price">{formattedPrice}đ</span>
                      <span className="pricing__period">
                        {billingCycle === 'yearly' ? '/ năm' : '/ tháng'}
                      </span>
                    </div>
                  </div>
                  <ul className="pricing__features-list">
                    {plan.features.map((feat, idx) => (
                      <li key={idx}>
                        <span className="material-symbols-outlined check">check_circle</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className={`pricing__btn ${isPopular ? 'pricing__btn--primary' : 'pricing__btn--secondary'}`}
                    onClick={() => handleSubscribe(plan.slug)}
                    disabled={isCurrent || processingSlug === plan.slug}
                  >
                    {processingSlug === plan.slug ? (
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    ) : isCurrent ? (
                      'Gói đang hoạt động'
                    ) : (
                      <>
                        <span>Nâng cấp qua VietQR</span>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </>
        ) : (
          /* DYNAMIC TEACHER PLANS */
          teacherPlans.map((plan) => {
            const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
            const formattedPrice = price.toLocaleString('vi-VN')
            const isCurrent = currentTierInfo?.tier === plan.tier
            const isPopular = plan.tier === 'pro' || !!plan.highlightBadge

            return (
              <div key={plan.slug} className={`pricing__card pricing__card--teacher ${isPopular ? 'popular' : ''}`}>
                {plan.highlightBadge && (
                  <div className="pricing__popular-badge">{plan.highlightBadge}</div>
                )}
                <div className="pricing__card-head">
                  <div className="pricing__sponsor-pill">
                    <span className="material-symbols-outlined">group</span>
                    <span>Bảo trợ {plan.maxSponsoredStudents} Học sinh</span>
                  </div>
                  <h3 className="pricing__card-name">{plan.name}</h3>
                  <p className="pricing__card-desc">{plan.description}</p>
                  <div className="pricing__price-box">
                    <span className="pricing__price">{formattedPrice}đ</span>
                    <span className="pricing__period">
                      {billingCycle === 'yearly' ? '/ năm' : '/ tháng'}
                    </span>
                  </div>
                </div>
                <ul className="pricing__features-list">
                  {plan.features.map((feat, idx) => (
                    <li key={idx}>
                      <span className="material-symbols-outlined check">check_circle</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={`pricing__btn ${isPopular ? 'pricing__btn--primary' : 'pricing__btn--secondary'}`}
                  onClick={() => handleSubscribe(plan.slug)}
                  disabled={isCurrent || processingSlug === plan.slug}
                >
                  {processingSlug === plan.slug ? (
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  ) : isCurrent ? (
                    'Gói đang hoạt động'
                  ) : (
                    <>
                      <span>Đăng ký gói Giáo viên</span>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            )
          })
        )}
      </section>

      {/* FAQ Section */}
      <section className="pricing__faq">
        <h2 className="pricing__faq-title">Câu hỏi thường gặp (FAQ)</h2>
        <div className="pricing__faq-grid">
          <div className="pricing__faq-item">
            <h4>Thanh toán qua VietQR PayOS như thế nào?</h4>
            <p>
              Khi bấm Nâng cấp, hệ thống sẽ tạo một mã VietQR động với số tiền và nội dung chính xác. Bạn chỉ cần mở App ngân hàng (VCB, MB, Techcombank, Momo, v.v.) và quét mã. Gói cước sẽ được kích hoạt tự động sau 1-2 giây.
            </p>
          </div>
          <div className="pricing__faq-item">
            <h4>Học sinh trong lớp của giáo viên có cần trả tiền không?</h4>
            <p>
              Hoàn toàn KHÔNG. Khi giáo viên mua gói Teacher (Plus, Pro, Ultra), tất cả học sinh được thêm vào lớp sẽ tự động được cấp quyền cao cấp tương ứng mà không phải tốn thêm bất kỳ chi phí nào.
            </p>
          </div>
          <div className="pricing__faq-item">
            <h4>Tôi có thể nâng cấp từ gói Tháng lên gói Năm không?</h4>
            <p>
              Có, bạn có thể chuyển đổi bất kỳ lúc nào. Thời hạn còn lại của gói cũ sẽ được hệ thống tính toán và cộng dồn vào gói mới.
            </p>
          </div>
          <div className="pricing__faq-item">
            <h4>Tôi có được hoàn tiền nếu không hài lòng?</h4>
            <p>
              LexiGrow cam kết hoàn tiền trong vòng 7 ngày đầu tiên nếu bạn gặp sự cố kỹ thuật hoặc không hài lòng với chất lượng dịch vụ AI.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
