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
      const plansList = Array.isArray(resPlans) ? resPlans : (resPlans?.data || [])
      setPlans(plansList)

      if (isAuthenticated) {
        const resTier = await paymentService.getMySubscription()
        const tierObj = resTier?.data || (resTier?.tier ? resTier : null)
        setCurrentTierInfo(tierObj)
      }
    } catch (err) {
      console.error('Error loading pricing data:', err)
      setError('Unable to load pricing plans. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubscribe(planSlug) {
    if (!isAuthenticated) {
      navigate('/login', { state: { infoMessage: 'Please log in to upgrade your subscription plan.' } })
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
        setError('Did not receive checkout link from PayOS. Please try again.')
      }
    } catch (err) {
      setError(err.message || 'Error creating PayOS payment link.')
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
          <span className="pricing__badge-dot" />
          <span className="material-symbols-outlined pricing__badge-icon">verified_user</span>
          <span className="pricing__badge-text">Automated 24/7 payment via VietQR PayOS</span>
          <span className="pricing__badge-pill">SSL Secured</span>
        </div>
        <h1 className="pricing__title">Elevate Your English Mastery with LexiGrow AI</h1>
        <p className="pricing__subtitle">
          In-depth IELTS-standard essay scoring, unlock the complete Knowledge Garden, and accelerate language reflexes.
        </p>

        {/* Current Tier Alert if user is subscribed or sponsored */}
        {currentTierInfo && currentTierInfo.tier !== 'free' && (
          <div className="pricing__current-tier-alert">
            <span className="material-symbols-outlined">workspace_premium</span>
            <div>
              <strong>Your current plan: </strong>
              <span className="pricing__tier-tag">{currentTierInfo.tier.toUpperCase()}</span>
              {currentTierInfo.source === 'teacher_sponsored' && (
                <span> ({currentTierInfo.planName})</span>
              )}
              {currentTierInfo.expiresAt && (
                <span className="pricing__expire-text">
                  {' '}— Expires: {new Date(currentTierInfo.expiresAt).toLocaleDateString('en-US')}
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
            <span>For Students / Individuals</span>
          </button>
          <button
            type="button"
            className={`pricing__role-tab ${activeTab === 'teacher' ? 'active' : ''}`}
            onClick={() => setActiveTab('teacher')}
          >
            <span className="material-symbols-outlined">co_present</span>
            <span>For Teachers & Institutions</span>
          </button>
        </div>

        {/* Billing Cycle Switcher */}
        <div className="pricing__cycle-toggle-wrap">
          <span className={billingCycle === 'monthly' ? 'active' : ''}>Monthly</span>
          <button
            type="button"
            className={`pricing__toggle-btn ${billingCycle === 'yearly' ? 'yearly' : ''}`}
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            aria-label="Toggle billing cycle"
          >
            <div className="pricing__toggle-knob" />
          </button>
          <span className={billingCycle === 'yearly' ? 'active' : ''}>
            Yearly <span className="pricing__discount-pill">Save ~20%</span>
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
            <strong>Teacher Student Sponsorship Benefit:</strong>
            <p>
              When educators subscribe to a Teacher Plan, all students in your classes get{' '}
              <strong>premium features unlocked completely free</strong> up to the plan limit!
            </p>
          </div>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <section className="pricing__grid">
        {loading ? (
          <div className="pricing__loading">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            <p>Loading pricing plans...</p>
          </div>
        ) : activeTab === 'student' ? (
          <>
            {/* FREE PLAN */}
            <div className="pricing__card">
              <div className="pricing__card-head">
                <h3 className="pricing__card-name">Free Plan</h3>
                <p className="pricing__card-desc">Get started with contextual vocabulary acquisition.</p>
                <div className="pricing__price-box">
                  <span className="pricing__price">0 VND</span>
                  <span className="pricing__period">/ lifetime</span>
                </div>
              </div>
              <ul className="pricing__features-list">
                <li><span className="material-symbols-outlined check">check_circle</span> 3 AI essay reviews & scores daily</li>
                <li><span className="material-symbols-outlined check">check_circle</span> Join up to 1 classroom</li>
                <li><span className="material-symbols-outlined check">check_circle</span> Access 3 foundation vocabulary decks</li>
                <li><span className="material-symbols-outlined check">check_circle</span> Standard Spaced Repetition (SRS) Flashcards</li>
              </ul>
              <button type="button" className="pricing__btn pricing__btn--outline" disabled>
                {currentTierInfo?.tier === 'free' ? 'Current Plan' : 'Default Plan'}
              </button>
            </div>

            {/* DYNAMIC STUDENT PLANS */}
            {studentPlans.map((plan) => {
              const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
              const formattedPrice = price.toLocaleString('en-US')
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
                      <span className="pricing__price">{formattedPrice} VND</span>
                      <span className="pricing__period">
                        {billingCycle === 'yearly' ? '/ year' : '/ month'}
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
                      'Current Plan'
                    ) : (
                      <>
                        <span>Upgrade with VietQR</span>
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
            const formattedPrice = price.toLocaleString('en-US')
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
                    <span>Sponsor {plan.maxSponsoredStudents} Students</span>
                  </div>
                  <h3 className="pricing__card-name">{plan.name}</h3>
                  <p className="pricing__card-desc">{plan.description}</p>
                  <div className="pricing__price-box">
                    <span className="pricing__price">{formattedPrice} VND</span>
                    <span className="pricing__period">
                      {billingCycle === 'yearly' ? '/ year' : '/ month'}
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
                    'Current Plan'
                  ) : (
                    <>
                      <span>Subscribe to Teacher Plan</span>
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
        <h2 className="pricing__faq-title">Frequently Asked Questions (FAQ)</h2>
        <div className="pricing__faq-grid">
          <div className="pricing__faq-item">
            <h4>How does payment via VietQR PayOS work?</h4>
            <p>
              When you click Upgrade, the system generates a dynamic VietQR code with the exact amount and transfer description. Simply open your banking or e-wallet app (Vietcombank, MB, Techcombank, MoMo, etc.) and scan the code. Your subscription activates automatically within 1-2 seconds.
            </p>
          </div>
          <div className="pricing__faq-item">
            <h4>Do students in a teacher's class need to pay?</h4>
            <p>
              No, not at all! When a teacher subscribes to a Teacher Plan (Plus, Pro, Ultra), all students added to their classes automatically receive full premium access without paying anything.
            </p>
          </div>
          <div className="pricing__faq-item">
            <h4>Can I upgrade from a monthly plan to a yearly plan?</h4>
            <p>
              Yes, you can switch at any time. Any remaining duration from your current plan will be calculated and prorated into your new plan.
            </p>
          </div>
          <div className="pricing__faq-item">
            <h4>Can I get a refund if I am not satisfied?</h4>
            <p>
              LexiGrow offers a 7-day money-back guarantee if you experience technical issues or are not completely satisfied with our AI learning experience.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
