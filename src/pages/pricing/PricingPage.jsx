import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import paymentService from '../../services/payment.service.js'
import './PricingPage.css'

const FEATURE_TRANSLATIONS = {
  // Free Features
  '3 AI essay reviews & scores daily': {
    en: '3 AI essay reviews & scores daily',
    vi: '3 bài chấm & sửa luận AI mỗi ngày',
  },
  '3 bài chấm & sửa luận AI mỗi ngày': {
    en: '3 AI essay reviews & scores daily',
    vi: '3 bài chấm & sửa luận AI mỗi ngày',
  },
  'Join up to 1 classroom': {
    en: 'Join up to 1 classroom',
    vi: 'Tham gia tối đa 1 lớp học',
  },
  'Tham gia tối đa 1 lớp học': {
    en: 'Join up to 1 classroom',
    vi: 'Tham gia tối đa 1 lớp học',
  },
  'Access 3 foundation vocabulary decks': {
    en: 'Access 3 foundation vocabulary decks',
    vi: 'Truy cập 3 bộ từ vựng nền tảng',
  },
  'Truy cập 3 bộ từ vựng nền tảng': {
    en: 'Access 3 foundation vocabulary decks',
    vi: 'Truy cập 3 bộ từ vựng nền tảng',
  },
  'Standard Spaced Repetition (SRS) Flashcards': {
    en: 'Standard Spaced Repetition (SRS) Flashcards',
    vi: 'Thẻ ghi nhớ lặp lại ngắt quãng (SRS) tiêu chuẩn',
  },
  'Thẻ ghi nhớ lặp lại ngắt quãng (SRS) tiêu chuẩn': {
    en: 'Standard Spaced Repetition (SRS) Flashcards',
    vi: 'Thẻ ghi nhớ lặp lại ngắt quãng (SRS) tiêu chuẩn',
  },

  // Student Plus
  '15 bài chấm & sửa luận AI mỗi ngày': {
    en: '15 AI essay reviews & scores daily',
    vi: '15 bài chấm & sửa luận AI mỗi ngày',
  },
  '15 AI essay reviews & scores daily': {
    en: '15 AI essay reviews & scores daily',
    vi: '15 bài chấm & sửa luận AI mỗi ngày',
  },
  'Mở khóa toàn bộ Flashcard SRS & Vườn Tri Thức': {
    en: 'Unlock all SRS Flashcards & Knowledge Garden',
    vi: 'Mở khóa toàn bộ Flashcard SRS & Vườn Tri Thức',
  },
  'Unlock all SRS Flashcards & Knowledge Garden': {
    en: 'Unlock all SRS Flashcards & Knowledge Garden',
    vi: 'Mở khóa toàn bộ Flashcard SRS & Vườn Tri Thức',
  },
  'Tham gia không giới hạn số lớp học': {
    en: 'Join unlimited classrooms',
    vi: 'Tham gia không giới hạn số lớp học',
  },
  'Join unlimited classrooms': {
    en: 'Join unlimited classrooms',
    vi: 'Tham gia không giới hạn số lớp học',
  },
  'Theo dõi chi tiết biểu đồ từ vựng chủ động': {
    en: 'Detailed active vocabulary growth chart',
    vi: 'Theo dõi chi tiết biểu đồ từ vựng chủ động',
  },
  'Detailed active vocabulary growth chart': {
    en: 'Detailed active vocabulary growth chart',
    vi: 'Theo dõi chi tiết biểu đồ từ vựng chủ động',
  },
  'Hỗ trợ phản hồi AI chuẩn khung CEFR A2-B2': {
    en: 'AI feedback aligned with CEFR A2-B2',
    vi: 'Hỗ trợ phản hồi AI chuẩn khung CEFR A2-B2',
  },
  'AI feedback aligned with CEFR A2-B2': {
    en: 'AI feedback aligned with CEFR A2-B2',
    vi: 'Hỗ trợ phản hồi AI chuẩn khung CEFR A2-B2',
  },

  // Student Pro
  'Không giới hạn bài viết luận & phân tích AI': {
    en: 'Unlimited essay writing & AI analysis',
    vi: 'Không giới hạn bài viết luận & phân tích AI',
  },
  'Unlimited essay writing & AI analysis': {
    en: 'Unlimited essay writing & AI analysis',
    vi: 'Không giới hạn bài viết luận & phân tích AI',
  },
  'Đánh giá 4 tiêu chí chuẩn IELTS Band 8.5+': {
    en: 'Evaluation on 4 IELTS Band 8.5+ criteria',
    vi: 'Đánh giá 4 tiêu chí chuẩn IELTS Band 8.5+',
  },
  'Evaluation on 4 IELTS Band 8.5+ criteria': {
    en: 'Evaluation on 4 IELTS Band 8.5+ criteria',
    vi: 'Đánh giá 4 tiêu chí chuẩn IELTS Band 8.5+',
  },
  'Gợi ý nâng cấp từ vựng Collocations & Ngữ pháp nâng cao': {
    en: 'Advanced Collocations & Grammar recommendations',
    vi: 'Gợi ý nâng cấp từ vựng Collocations & Ngữ pháp nâng cao',
  },
  'Advanced Collocations & Grammar recommendations': {
    en: 'Advanced Collocations & Grammar recommendations',
    vi: 'Gợi ý nâng cấp từ vựng Collocations & Ngữ pháp nâng cao',
  },
  'So sánh tiến độ giữa các bản sửa (Revision Compare)': {
    en: 'Revision progress comparison timeline',
    vi: 'So sánh tiến độ giữa các bản sửa (Revision Compare)',
  },
  'Revision progress comparison timeline': {
    en: 'Revision progress comparison timeline',
    vi: 'So sánh tiến độ giữa các bản sửa (Revision Compare)',
  },
  'Xuất báo cáo học tập PDF chuyên nghiệp': {
    en: 'Export professional learning PDF reports',
    vi: 'Xuất báo cáo học tập PDF chuyên nghiệp',
  },
  'Export professional learning PDF reports': {
    en: 'Export professional learning PDF reports',
    vi: 'Xuất báo cáo học tập PDF chuyên nghiệp',
  },
  'Ưu tiên tốc độ phản hồi AI siêu tốc': {
    en: 'Ultra-fast priority AI response queue',
    vi: 'Ưu tiên tốc độ phản hồi AI siêu tốc',
  },
  'Ultra-fast priority AI response queue': {
    en: 'Ultra-fast priority AI response queue',
    vi: 'Ưu tiên tốc độ phản hồi AI siêu tốc',
  },

  // Student Ultra
  'Toàn bộ quyền lợi của gói Student Pro': {
    en: 'All benefits of Student Pro plan',
    vi: 'Toàn bộ quyền lợi của gói Student Pro',
  },
  'All benefits of Student Pro plan': {
    en: 'All benefits of Student Pro plan',
    vi: 'Toàn bộ quyền lợi của gói Student Pro',
  },
  'Trợ lý Gia sư AI 1-on-1 tương tác đàm thoại trực tiếp': {
    en: '1-on-1 interactive conversational AI Tutor',
    vi: 'Trợ lý Gia sư AI 1-on-1 tương tác đàm thoại trực tiếp',
  },
  '1-on-1 interactive conversational AI Tutor': {
    en: '1-on-1 interactive conversational AI Tutor',
    vi: 'Trợ lý Gia sư AI 1-on-1 tương tác đàm thoại trực tiếp',
  },
  'Phân tích phong cách diễn đạt & Tính mạch lạc chuyên sâu': {
    en: 'Deep discourse style & coherence analysis',
    vi: 'Phân tích phong cách diễn đạt & Tính mạch lạc chuyên sâu',
  },
  'Deep discourse style & coherence analysis': {
    en: 'Deep discourse style & coherence analysis',
    vi: 'Phân tích phong cách diễn đạt & Tính mạch lạc chuyên sâu',
  },
  'Luyện viết theo chủ đề bài thi thực chiến': {
    en: 'Practice writing on actual exam topics',
    vi: 'Luyện viết theo chủ đề bài thi thực chiến',
  },
  'Practice writing on actual exam topics': {
    en: 'Practice writing on actual exam topics',
    vi: 'Luyện viết theo chủ đề bài thi thực chiến',
  },
  'Băng thông AI ưu tiên cao nhất, không nghẽn giờ cao điểm': {
    en: 'Highest priority AI bandwidth, zero peak-hour queue',
    vi: 'Băng thông AI ưu tiên cao nhất, không nghẽn giờ cao điểm',
  },
  'Highest priority AI bandwidth, zero peak-hour queue': {
    en: 'Highest priority AI bandwidth, zero peak-hour queue',
    vi: 'Băng thông AI ưu tiên cao nhất, không nghẽn giờ cao điểm',
  },
  'Hỗ trợ kỹ thuật 24/7 từ chuyên viên học thuật': {
    en: '24/7 academic & technical priority support',
    vi: 'Hỗ trợ kỹ thuật 24/7 từ chuyên viên học thuật',
  },
  '24/7 academic & technical priority support': {
    en: '24/7 academic & technical priority support',
    vi: 'Hỗ trợ kỹ thuật 24/7 từ chuyên viên học thuật',
  },

  // Teacher Plus
  'Bảo trợ miễn phí cho tối đa 30 học sinh (dùng quyền Plus)': {
    en: 'Sponsor up to 30 students for free (Plus benefits)',
    vi: 'Bảo trợ miễn phí cho tối đa 30 học sinh (dùng quyền Plus)',
  },
  'Sponsor up to 30 students for free (Plus benefits)': {
    en: 'Sponsor up to 30 students for free (Plus benefits)',
    vi: 'Bảo trợ miễn phí cho tối đa 30 học sinh (dùng quyền Plus)',
  },
  'Tạo tối đa 3 lớp học trực tuyến': {
    en: 'Create up to 3 online classrooms',
    vi: 'Tạo tối đa 3 lớp học trực tuyến',
  },
  'Create up to 3 online classrooms': {
    en: 'Create up to 3 online classrooms',
    vi: 'Tạo tối đa 3 lớp học trực tuyến',
  },
  'Giao bài tập kèm từ khóa mục tiêu không giới hạn': {
    en: 'Unlimited target vocabulary assignment creation',
    vi: 'Giao bài tập kèm từ khóa mục tiêu không giới hạn',
  },
  'Unlimited target vocabulary assignment creation': {
    en: 'Unlimited target vocabulary assignment creation',
    vi: 'Giao bài tập kèm từ khóa mục tiêu không giới hạn',
  },
  'Theo dõi tình trạng nộp bài và chấm điểm thủ công': {
    en: 'Submission tracking & manual grading override',
    vi: 'Theo dõi tình trạng nộp bài và chấm điểm thủ công',
  },
  'Submission tracking & manual grading override': {
    en: 'Submission tracking & manual grading override',
    vi: 'Theo dõi tình trạng nộp bài và chấm điểm thủ công',
  },
  'Học sinh trong lớp không cần mua gói dịch vụ': {
    en: 'Classroom students do not need to buy subscriptions',
    vi: 'Học sinh trong lớp không cần mua gói dịch vụ',
  },
  'Classroom students do not need to buy subscriptions': {
    en: 'Classroom students do not need to buy subscriptions',
    vi: 'Học sinh trong lớp không cần mua gói dịch vụ',
  },

  // Teacher Pro
  'Bảo trợ miễn phí cho tối đa 100 học sinh (dùng quyền Pro)': {
    en: 'Sponsor up to 100 students for free (Pro benefits)',
    vi: 'Bảo trợ miễn phí cho tối đa 100 học sinh (dùng quyền Pro)',
  },
  'Sponsor up to 100 students for free (Pro benefits)': {
    en: 'Sponsor up to 100 students for free (Pro benefits)',
    vi: 'Bảo trợ miễn phí cho tối đa 100 học sinh (dùng quyền Pro)',
  },
  'Tạo tối đa 10 lớp học trực tuyến': {
    en: 'Create up to 10 online classrooms',
    vi: 'Tạo tối đa 10 lớp học trực tuyến',
  },
  'Create up to 10 online classrooms': {
    en: 'Create up to 10 online classrooms',
    vi: 'Tạo tối đa 10 lớp học trực tuyến',
  },
  'Tùy biến System Prompt AI theo yêu cầu giảng dạy': {
    en: 'Customizable AI System Prompts for pedagogy',
    vi: 'Tùy biến System Prompt AI theo yêu cầu giảng dạy',
  },
  'Customizable AI System Prompts for pedagogy': {
    en: 'Customizable AI System Prompts for pedagogy',
    vi: 'Tùy biến System Prompt AI theo yêu cầu giảng dạy',
  },
  'Hệ thống Cảnh báo sớm (EWS) tự động phát hiện học sinh tụt dốc': {
    en: 'Early Warning System (EWS) detecting at-risk students',
    vi: 'Hệ thống Cảnh báo sớm (EWS) tự động phát hiện học sinh tụt dốc',
  },
  'Early Warning System (EWS) detecting at-risk students': {
    en: 'Early Warning System (EWS) detecting at-risk students',
    vi: 'Hệ thống Cảnh báo sớm (EWS) tự động phát hiện học sinh tụt dốc',
  },
  'Xuất báo cáo phổ điểm và phân tích năng lực cả lớp': {
    en: 'Export class-wide score distribution & competency reports',
    vi: 'Xuất báo cáo phổ điểm và phân tích năng lực cả lớp',
  },
  'Export class-wide score distribution & competency reports': {
    en: 'Export class-wide score distribution & competency reports',
    vi: 'Xuất báo cáo phổ điểm và phân tích năng lực cả lớp',
  },

  // Teacher Ultra
  'Bảo trợ miễn phí cho tối đa 300 học sinh (dùng quyền Ultra)': {
    en: 'Sponsor up to 300 students for free (Ultra benefits)',
    vi: 'Bảo trợ miễn phí cho tối đa 300 học sinh (dùng quyền Ultra)',
  },
  'Sponsor up to 300 students for free (Ultra benefits)': {
    en: 'Sponsor up to 300 students for free (Ultra benefits)',
    vi: 'Bảo trợ miễn phí cho tối đa 300 học sinh (dùng quyền Ultra)',
  },
  'Không giới hạn số lượng lớp học': {
    en: 'Unlimited online classrooms',
    vi: 'Không giới hạn số lượng lớp học',
  },
  'Unlimited online classrooms': {
    en: 'Unlimited online classrooms',
    vi: 'Không giới hạn số lượng lớp học',
  },
  'Báo cáo phân tích chuyên sâu cấp độ tổ chức/khoa': {
    en: 'Deep organizational & faculty analytics reports',
    vi: 'Báo cáo phân tích chuyên sâu cấp độ tổ chức/khoa',
  },
  'Deep organizational & faculty analytics reports': {
    en: 'Deep organizational & faculty analytics reports',
    vi: 'Báo cáo phân tích chuyên sâu cấp độ tổ chức/khoa',
  },
  'API tích hợp hệ thống quản lý học tập (LMS Integration)': {
    en: 'LMS Integration API for institutions',
    vi: 'API tích hợp hệ thống quản lý học tập (LMS Integration)',
  },
  'LMS Integration API for institutions': {
    en: 'LMS Integration API for institutions',
    vi: 'API tích hợp hệ thống quản lý học tập (LMS Integration)',
  },
  'Hỗ trợ thiết kế Prompt & Đào tạo giáo viên 1-on-1': {
    en: '1-on-1 Prompt engineering & teacher onboarding',
    vi: 'Hỗ trợ thiết kế Prompt & Đào tạo giáo viên 1-on-1',
  },
  '1-on-1 Prompt engineering & teacher onboarding': {
    en: '1-on-1 Prompt engineering & teacher onboarding',
    vi: 'Hỗ trợ thiết kế Prompt & Đào tạo giáo viên 1-on-1',
  },
}

const PLAN_DESCRIPTIONS = {
  'student-plus': {
    vi: 'Nâng cao vốn từ và tốc độ viết luận với trợ lý AI.',
    en: 'Accelerate vocabulary and essay writing speed with AI.',
  },
  'student-pro': {
    vi: 'Chinh phục IELTS & Viết luận học thuật đỉnh cao.',
    en: 'Master IELTS & Academic Writing with advanced AI rubrics.',
  },
  'student-ultra': {
    vi: 'Trải nghiệm học tập cá nhân hóa với gia sư AI 1-on-1.',
    en: 'Personalized 1-on-1 AI tutor and conversational feedback.',
  },
  'teacher-plus': {
    vi: 'Dành cho giáo viên / gia sư quản lý các lớp học nhỏ.',
    en: 'For teachers and tutors managing small classrooms.',
  },
  'teacher-pro': {
    vi: 'Giải pháp toàn diện cho trung tâm và giáo viên chuyên nghiệp.',
    en: 'Comprehensive solution for institutions and professional teachers.',
  },
  'teacher-ultra': {
    vi: 'Hạ tầng giáo dục cao cấp cho trường học và tổ chức.',
    en: 'Enterprise educational infrastructure for schools & organizations.',
  },
}

const BADGE_TRANSLATIONS = {
  'Phổ biến nhất': { vi: 'Phổ biến nhất', en: 'Most Popular' },
  'Most Popular': { vi: 'Phổ biến nhất', en: 'Most Popular' },
  'Đỉnh cao AI': { vi: 'Đỉnh cao AI', en: 'Top AI Value' },
  'Top AI Value': { vi: 'Đỉnh cao AI', en: 'Top AI Value' },
}

export default function PricingPage() {
  const { user, isAuthenticated } = useAuth()
  const { t, language } = useLanguage()
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
      setError(t('pricing.loadingError', 'Unable to load pricing plans. Please try again later.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleSubscribe(planSlug) {
    if (!isAuthenticated) {
      navigate('/login', {
        state: { infoMessage: t('pricing.loginPrompt', 'Please log in to upgrade your subscription plan.') },
      })
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
        setError(t('pricing.checkoutError', 'Did not receive checkout link from PayOS. Please try again.'))
      }
    } catch (err) {
      setError(err.message || t('pricing.checkoutError', 'Error creating PayOS payment link.'))
    } finally {
      setProcessingSlug(null)
    }
  }

  const getTranslatedFeature = (feat) => {
    if (!feat) return ''
    const match = FEATURE_TRANSLATIONS[feat]
    if (match && match[language]) {
      return match[language]
    }
    return feat
  }

  const getTranslatedDesc = (plan) => {
    if (PLAN_DESCRIPTIONS[plan.slug] && PLAN_DESCRIPTIONS[plan.slug][language]) {
      return PLAN_DESCRIPTIONS[plan.slug][language]
    }
    return plan.description
  }

  const getTranslatedBadge = (badge) => {
    if (!badge) return ''
    if (BADGE_TRANSLATIONS[badge] && BADGE_TRANSLATIONS[badge][language]) {
      return BADGE_TRANSLATIONS[badge][language]
    }
    return badge
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
          <span className="pricing__badge-text">{t('pricing.badgeText', 'Automated 24/7 payment via VietQR PayOS')}</span>
          <span className="pricing__badge-pill">{t('pricing.sslSecured', 'SSL Secured')}</span>
        </div>
        <h1 className="pricing__title">{t('pricing.title', 'Choose the Right Learning Plan')}</h1>
        <p className="pricing__subtitle">
          {t(
            'pricing.headerSubtitle',
            'In-depth IELTS-standard essay scoring, unlock the complete Knowledge Garden, and accelerate language reflexes.'
          )}
        </p>

        {/* Current Tier Alert if user is subscribed or sponsored */}
        {currentTierInfo && currentTierInfo.tier !== 'free' && (
          <div className="pricing__current-tier-alert">
            <span className="material-symbols-outlined">workspace_premium</span>
            <div>
              <strong>{t('pricing.currentPlanAlert', 'Your current plan')}: </strong>
              <span className="pricing__tier-tag">{currentTierInfo.tier.toUpperCase()}</span>
              {currentTierInfo.source === 'teacher_sponsored' && (
                <span> ({currentTierInfo.planName})</span>
              )}
              {currentTierInfo.expiresAt && (
                <span className="pricing__expire-text">
                  {' '}— {new Date(currentTierInfo.expiresAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
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
            <span>{t('pricing.forStudents', 'For Students / Individuals')}</span>
          </button>
          <button
            type="button"
            className={`pricing__role-tab ${activeTab === 'teacher' ? 'active' : ''}`}
            onClick={() => setActiveTab('teacher')}
          >
            <span className="material-symbols-outlined">co_present</span>
            <span>{t('pricing.forTeachers', 'For Teachers & Institutions')}</span>
          </button>
        </div>

        {/* Billing Cycle Switcher */}
        <div className="pricing__cycle-toggle-wrap">
          <span className={billingCycle === 'monthly' ? 'active' : ''}>{t('pricing.monthly', 'Monthly')}</span>
          <button
            type="button"
            className={`pricing__toggle-btn ${billingCycle === 'yearly' ? 'yearly' : ''}`}
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            aria-label="Toggle billing cycle"
          >
            <div className="pricing__toggle-knob" />
          </button>
          <span className={billingCycle === 'yearly' ? 'active' : ''}>
            {t('pricing.yearly', 'Yearly')} <span className="pricing__discount-pill">{t('pricing.save20', 'Save ~20%')}</span>
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
            <strong>{t('pricing.teacherBenefitTitle', 'Teacher Student Sponsorship Benefit:')}</strong>
            <p>
              {t(
                'pricing.teacherBenefitDesc',
                'When educators subscribe to a Teacher Plan, all students in your classes get premium features unlocked completely free up to the plan limit!'
              )}
            </p>
          </div>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <section className="pricing__grid">
        {loading ? (
          <div className="pricing__loading">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            <p>{t('pricing.loadingPlans', 'Loading pricing plans...')}</p>
          </div>
        ) : activeTab === 'student' ? (
          <>
            {/* FREE PLAN */}
            <div className="pricing__card">
              <div className="pricing__card-head">
                <h3 className="pricing__card-name">{t('pricing.freePlan', 'Free Plan')}</h3>
                <p className="pricing__card-desc">{t('pricing.freePlanDesc', 'Get started with contextual vocabulary acquisition.')}</p>
                <div className="pricing__price-box">
                  <div className="pricing__price-wrapper">
                    <span className="pricing__price">0</span>
                    <span className="pricing__currency">VND</span>
                  </div>
                  <span className="pricing__period">{t('pricing.perLifetime', '/ lifetime')}</span>
                </div>
              </div>
              <ul className="pricing__features-list">
                <li>
                  <span className="material-symbols-outlined check">check_circle</span>
                  <span>{t('pricing.freeFeature1', '3 AI essay reviews & scores daily')}</span>
                </li>
                <li>
                  <span className="material-symbols-outlined check">check_circle</span>
                  <span>{t('pricing.freeFeature2', 'Join up to 1 classroom')}</span>
                </li>
                <li>
                  <span className="material-symbols-outlined check">check_circle</span>
                  <span>{t('pricing.freeFeature3', 'Access 3 foundation vocabulary decks')}</span>
                </li>
                <li>
                  <span className="material-symbols-outlined check">check_circle</span>
                  <span>{t('pricing.freeFeature4', 'Standard Spaced Repetition (SRS) Flashcards')}</span>
                </li>
              </ul>
              <button type="button" className="pricing__btn pricing__btn--outline" disabled>
                {currentTierInfo?.tier === 'free' ? t('pricing.currentPlan', 'Current Plan') : t('pricing.defaultPlan', 'Default Plan')}
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
                    <div className="pricing__popular-badge">{getTranslatedBadge(plan.highlightBadge)}</div>
                  )}
                  <div className="pricing__card-head">
                    <h3 className="pricing__card-name">{plan.name}</h3>
                    <p className="pricing__card-desc">{getTranslatedDesc(plan)}</p>
                    <div className="pricing__price-box">
                      <div className="pricing__price-wrapper">
                        <span className="pricing__price">{formattedPrice}</span>
                        <span className="pricing__currency">VND</span>
                      </div>
                      <span className="pricing__period">
                        {billingCycle === 'yearly' ? t('pricing.perYear', '/ year') : t('pricing.perMonth', '/ month')}
                      </span>
                    </div>
                  </div>
                  <ul className="pricing__features-list">
                    {plan.features.map((feat, idx) => (
                      <li key={idx}>
                        <span className="material-symbols-outlined check">check_circle</span>
                        <span>{getTranslatedFeature(feat)}</span>
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
                      t('pricing.currentPlan', 'Current Plan')
                    ) : (
                      <>
                        <span>{t('pricing.choosePlan', 'Upgrade with PayOS')}</span>
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
                  <div className="pricing__popular-badge">{getTranslatedBadge(plan.highlightBadge)}</div>
                )}
                <div className="pricing__card-head">
                  <div className="pricing__sponsor-pill">
                    <span className="material-symbols-outlined">group</span>
                    <span>{t('pricing.sponsorStudents', 'Sponsor {count} Students', { count: plan.maxSponsoredStudents })}</span>
                  </div>
                  <h3 className="pricing__card-name">{plan.name}</h3>
                  <p className="pricing__card-desc">{getTranslatedDesc(plan)}</p>
                  <div className="pricing__price-box">
                    <div className="pricing__price-wrapper">
                      <span className="pricing__price">{formattedPrice}</span>
                      <span className="pricing__currency">VND</span>
                    </div>
                    <span className="pricing__period">
                      {billingCycle === 'yearly' ? t('pricing.perYear', '/ year') : t('pricing.perMonth', '/ month')}
                    </span>
                  </div>
                </div>
                <ul className="pricing__features-list">
                  {plan.features.map((feat, idx) => (
                    <li key={idx}>
                      <span className="material-symbols-outlined check">check_circle</span>
                      <span>{getTranslatedFeature(feat)}</span>
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
                    t('pricing.currentPlan', 'Current Plan')
                  ) : (
                    <>
                      <span>{t('pricing.chooseTeacherPlan', 'Subscribe to Teacher Plan')}</span>
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
        <h2 className="pricing__faq-title">{t('pricing.faqTitle', 'Frequently Asked Questions (FAQ)')}</h2>
        <div className="pricing__faq-grid">
          <div className="pricing__faq-item">
            <h4>{t('pricing.faq1Q', 'How does payment via VietQR PayOS work?')}</h4>
            <p>{t('pricing.faq1A', 'You select a plan, scan the dynamic VietQR code with any Vietnamese banking app, and your plan activates automatically within seconds.')}</p>
          </div>
          <div className="pricing__faq-item">
            <h4>{t('pricing.faq2Q', 'What happens when a teacher upgrades?')}</h4>
            <p>{t('pricing.faq2A', 'When a teacher purchases Pro/Ultra Teacher plans, all linked students in their classrooms automatically receive full Pro essay grading access.')}</p>
          </div>
          <div className="pricing__faq-item">
            <h4>{t('pricing.faq3Q', 'Can I cancel or change plans anytime?')}</h4>
            <p>{t('pricing.faq3A', 'Yes, your active subscription remains valid until the end of the billing period without any hidden fees.')}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
