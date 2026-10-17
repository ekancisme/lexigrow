import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import paymentService from '../../services/payment.service.js'
import api from '../../services/api.js'
import './PricingPage.css'

const FEATURE_TRANSLATIONS = {
  // Free Features
  '3 AI essay reviews & scores daily': { en: '3 AI essay reviews & scores daily', vi: '3 bài chấm & sửa luận AI mỗi ngày' },
  '3 bài chấm & sửa luận AI mỗi ngày': { en: '3 AI essay reviews & scores daily', vi: '3 bài chấm & sửa luận AI mỗi ngày' },
  'Join up to 1 classroom': { en: 'Join up to 1 classroom', vi: 'Tham gia tối đa 1 lớp học' },
  'Tham gia tối đa 1 lớp học': { en: 'Join up to 1 classroom', vi: 'Tham gia tối đa 1 lớp học' },
  'Access 3 foundation vocabulary decks': { en: 'Access 3 foundation vocabulary decks', vi: 'Truy cập 3 bộ từ vựng nền tảng' },
  'Truy cập 3 bộ từ vựng nền tảng': { en: 'Access 3 foundation vocabulary decks', vi: 'Truy cập 3 bộ từ vựng nền tảng' },
  'Standard Spaced Repetition (SRS) Flashcards': { en: 'Standard Spaced Repetition (SRS) Flashcards', vi: 'Thẻ ghi nhớ lặp lại ngắt quãng (SRS) tiêu chuẩn' },
  'Thẻ ghi nhớ lặp lại ngắt quãng (SRS) tiêu chuẩn': { en: 'Standard Spaced Repetition (SRS) Flashcards', vi: 'Thẻ ghi nhớ lặp lại ngắt quãng (SRS) tiêu chuẩn' },

  // Student Plus
  '15 bài chấm & sửa luận AI mỗi ngày': { en: '15 AI essay reviews & scores daily', vi: '15 bài chấm & sửa luận AI mỗi ngày' },
  '15 AI essay reviews & scores daily': { en: '15 AI essay reviews & scores daily', vi: '15 bài chấm & sửa luận AI mỗi ngày' },
  'Mở khóa toàn bộ Flashcard SRS & Vườn Tri Thức': { en: 'Unlock all SRS Flashcards & Knowledge Garden', vi: 'Mở khóa toàn bộ Flashcard SRS & Vườn Tri Thức' },
  'Unlock all SRS Flashcards & Knowledge Garden': { en: 'Unlock all SRS Flashcards & Knowledge Garden', vi: 'Mở khóa toàn bộ Flashcard SRS & Vườn Tri Thức' },
  'Tham gia không giới hạn số lớp học': { en: 'Join unlimited classrooms', vi: 'Tham gia không giới hạn số lớp học' },
  'Join unlimited classrooms': { en: 'Join unlimited classrooms', vi: 'Tham gia không giới hạn số lớp học' },
  'Theo dõi chi tiết biểu đồ từ vựng chủ động': { en: 'Detailed active vocabulary growth chart', vi: 'Theo dõi chi tiết biểu đồ từ vựng chủ động' },
  'Detailed active vocabulary growth chart': { en: 'Detailed active vocabulary growth chart', vi: 'Theo dõi chi tiết biểu đồ từ vựng chủ động' },
  'Hỗ trợ phản hồi AI chuẩn khung CEFR A2-B2': { en: 'AI feedback aligned with CEFR A2-B2', vi: 'Hỗ trợ phản hồi AI chuẩn khung CEFR A2-B2' },
  'AI feedback aligned with CEFR A2-B2': { en: 'AI feedback aligned with CEFR A2-B2', vi: 'Hỗ trợ phản hồi AI chuẩn khung CEFR A2-B2' },

  // Student Pro
  'Không giới hạn bài viết luận & phân tích AI': { en: 'Unlimited essay writing & AI analysis', vi: 'Không giới hạn bài viết luận & phân tích AI' },
  'Unlimited essay writing & AI analysis': { en: 'Unlimited essay writing & AI analysis', vi: 'Không giới hạn bài viết luận & phân tích AI' },
  'Đánh giá 4 tiêu chí chuẩn IELTS Band 8.5+': { en: 'Evaluation on 4 IELTS Band 8.5+ criteria', vi: 'Đánh giá 4 tiêu chí chuẩn IELTS Band 8.5+' },
  'Evaluation on 4 IELTS Band 8.5+ criteria': { en: 'Evaluation on 4 IELTS Band 8.5+ criteria', vi: 'Đánh giá 4 tiêu chí chuẩn IELTS Band 8.5+' },
  'Lộ trình mục tiêu từ vựng chuyên sâu (CEFR B2-C1)': { en: 'In-depth targeted vocabulary roadmap (B2-C1)', vi: 'Lộ trình mục tiêu từ vựng chuyên sâu (CEFR B2-C1)' },
  'In-depth targeted vocabulary roadmap (B2-C1)': { en: 'In-depth targeted vocabulary roadmap (B2-C1)', vi: 'Lộ trình mục tiêu từ vựng chuyên sâu (CEFR B2-C1)' },
  'Ưu tiên hàng đợi AI (Tốc độ phản hồi < 3s)': { en: 'Priority AI queue (Response < 3s)', vi: 'Ưu tiên hàng đợi AI (Tốc độ phản hồi < 3s)' },
  'Priority AI queue (Response < 3s)': { en: 'Priority AI queue (Response < 3s)', vi: 'Ưu tiên hàng đợi AI (Tốc độ phản hồi < 3s)' },
  'Huy hiệu Pro độc quyền trên bảng xếp hạng': { en: 'Exclusive Pro badge on leaderboard', vi: 'Huy hiệu Pro độc quyền trên bảng xếp hạng' },
  'Exclusive Pro badge on leaderboard': { en: 'Exclusive Pro badge on leaderboard', vi: 'Huy hiệu Pro độc quyền trên bảng xếp hạng' },

  // Student Ultra
  'Tất cả quyền lợi của gói Pro': { en: 'All Pro plan benefits', vi: 'Tất cả quyền lợi của gói Pro' },
  'All Pro plan benefits': { en: 'All Pro plan benefits', vi: 'Tất cả quyền lợi của gói Pro' },
  'Gia sư AI 1-on-1 tương tác thời gian thực': { en: '1-on-1 Real-time Interactive AI Tutor', vi: 'Gia sư AI 1-on-1 tương tác thời gian thực' },
  '1-on-1 Real-time Interactive AI Tutor': { en: '1-on-1 Real-time Interactive AI Tutor', vi: 'Gia sư AI 1-on-1 tương tác thời gian thực' },
  'Phân tích ngữ điệu và phát âm nâng cao': { en: 'Advanced intonation & pronunciation feedback', vi: 'Phân tích ngữ điệu và phát âm nâng cao' },
  'Advanced intonation & pronunciation feedback': { en: 'Advanced intonation & pronunciation feedback', vi: 'Phân tích ngữ điệu và phát âm nâng cao' },
  'Tư vấn chiến lược học tập từ chuyên gia': { en: 'Strategic study consulting from experts', vi: 'Tư vấn chiến lược học tập từ chuyên gia' },
  'Strategic study consulting from experts': { en: 'Strategic study consulting from experts', vi: 'Tư vấn chiến lược học tập từ chuyên gia' },
  'Hỗ trợ ưu tiên 24/7 qua kênh VIP': { en: '24/7 VIP priority support channel', vi: 'Hỗ trợ ưu tiên 24/7 qua kênh VIP' },
  '24/7 VIP priority support channel': { en: '24/7 VIP priority support channel', vi: 'Hỗ trợ ưu tiên 24/7 qua kênh VIP' },

  // Teacher Plus
  'Bảo trợ miễn phí cho tối đa 25 học sinh': { en: 'Sponsor up to 25 students for free', vi: 'Bảo trợ miễn phí cho tối đa 25 học sinh' },
  'Sponsor up to 25 students for free': { en: 'Sponsor up to 25 students for free', vi: 'Bảo trợ miễn phí cho tối đa 25 học sinh' },
  'Tạo tối đa 3 lớp học trực tuyến': { en: 'Create up to 3 online classrooms', vi: 'Tạo tối đa 3 lớp học trực tuyến' },
  'Create up to 3 online classrooms': { en: 'Create up to 3 online classrooms', vi: 'Tạo tối đa 3 lớp học trực tuyến' },
  'Giao bài tập kèm từ khóa mục tiêu không giới hạn': { en: 'Unlimited target vocabulary assignment creation', vi: 'Giao bài tập kèm từ khóa mục tiêu không giới hạn' },
  'Unlimited target vocabulary assignment creation': { en: 'Unlimited target vocabulary assignment creation', vi: 'Giao bài tập kèm từ khóa mục tiêu không giới hạn' },
  'Theo dõi tình trạng nộp bài và chấm điểm thủ công': { en: 'Submission tracking & manual grading override', vi: 'Theo dõi tình trạng nộp bài và chấm điểm thủ công' },
  'Submission tracking & manual grading override': { en: 'Submission tracking & manual grading override', vi: 'Theo dõi tình trạng nộp bài và chấm điểm thủ công' },
  'Học sinh trong lớp không cần mua gói dịch vụ': { en: 'Classroom students do not need to buy subscriptions', vi: 'Học sinh trong lớp không cần mua gói dịch vụ' },
  'Classroom students do not need to buy subscriptions': { en: 'Classroom students do not need to buy subscriptions', vi: 'Học sinh trong lớp không cần mua gói dịch vụ' },

  // Teacher Pro
  'Bảo trợ miễn phí cho tối đa 100 học sinh (dùng quyền Pro)': { en: 'Sponsor up to 100 students for free (Pro benefits)', vi: 'Bảo trợ miễn phí cho tối đa 100 học sinh (dùng quyền Pro)' },
  'Sponsor up to 100 students for free (Pro benefits)': { en: 'Sponsor up to 100 students for free (Pro benefits)', vi: 'Bảo trợ miễn phí cho tối đa 100 học sinh (dùng quyền Pro)' },
  'Tạo tối đa 10 lớp học trực tuyến': { en: 'Create up to 10 online classrooms', vi: 'Tạo tối đa 10 lớp học trực tuyến' },
  'Create up to 10 online classrooms': { en: 'Create up to 10 online classrooms', vi: 'Tạo tối đa 10 lớp học trực tuyến' },
  'Tùy biến System Prompt AI theo yêu cầu giảng dạy': { en: 'Customizable AI System Prompts for pedagogy', vi: 'Tùy biến System Prompt AI theo yêu cầu giảng dạy' },
  'Customizable AI System Prompts for pedagogy': { en: 'Customizable AI System Prompts for pedagogy', vi: 'Tùy biến System Prompt AI theo yêu cầu giảng dạy' },
  'Hệ thống Cảnh báo sớm (EWS) tự động phát hiện học sinh tụt dốc': { en: 'Early Warning System (EWS) detecting at-risk students', vi: 'Hệ thống Cảnh báo sớm (EWS) tự động phát hiện học sinh tụt dốc' },
  'Early Warning System (EWS) detecting at-risk students': { en: 'Early Warning System (EWS) detecting at-risk students', vi: 'Hệ thống Cảnh báo sớm (EWS) tự động phát hiện học sinh tụt dốc' },
  'Xuất báo cáo phổ điểm và phân tích năng lực cả lớp': { en: 'Export class-wide score distribution & competency reports', vi: 'Xuất báo cáo phổ điểm và phân tích năng lực cả lớp' },
  'Export class-wide score distribution & competency reports': { en: 'Export class-wide score distribution & competency reports', vi: 'Xuất báo cáo phổ điểm và phân tích năng lực cả lớp' },

  // Teacher Ultra
  'Bảo trợ miễn phí cho tối đa 300 học sinh (dùng quyền Ultra)': { en: 'Sponsor up to 300 students for free (Ultra benefits)', vi: 'Bảo trợ miễn phí cho tối đa 300 học sinh (dùng quyền Ultra)' },
  'Sponsor up to 300 students for free (Ultra benefits)': { en: 'Sponsor up to 300 students for free (Ultra benefits)', vi: 'Bảo trợ miễn phí cho tối đa 300 học sinh (dùng quyền Ultra)' },
  'Không giới hạn số lượng lớp học': { en: 'Unlimited online classrooms', vi: 'Không giới hạn số lượng lớp học' },
  'Unlimited online classrooms': { en: 'Unlimited online classrooms', vi: 'Không giới hạn số lượng lớp học' },
  'Báo cáo phân tích chuyên sâu cấp độ tổ chức/khoa': { en: 'Deep organizational & faculty analytics reports', vi: 'Báo cáo phân tích chuyên sâu cấp độ tổ chức/khoa' },
  'Deep organizational & faculty analytics reports': { en: 'Deep organizational & faculty analytics reports', vi: 'Báo cáo phân tích chuyên sâu cấp độ tổ chức/khoa' },
  'API tích hợp hệ thống quản lý học tập (LMS Integration)': { en: 'LMS Integration API for institutions', vi: 'API tích hợp hệ thống quản lý học tập (LMS Integration)' },
  'LMS Integration API for institutions': { en: 'LMS Integration API for institutions', vi: 'API tích hợp hệ thống quản lý học tập (LMS Integration)' },
  'Hỗ trợ thiết kế Prompt & Đào tạo giáo viên 1-on-1': { en: '1-on-1 Prompt engineering & teacher onboarding', vi: 'Hỗ trợ thiết kế Prompt & Đào tạo giáo viên 1-on-1' },
  '1-on-1 Prompt engineering & teacher onboarding': { en: '1-on-1 Prompt engineering & teacher onboarding', vi: 'Hỗ trợ thiết kế Prompt & Đào tạo giáo viên 1-on-1' },
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

const FAQ_ITEMS = [
  {
    qVi: 'Tôi cần trình độ tiếng Anh nào để bắt đầu học trên LexiGrow?',
    qEn: 'What level do I need to start learning at LexiGrow?',
    aVi: 'Nền tảng hỗ trợ từ trình độ người mới bắt đầu (A1/A2) đến nâng cao (B2/C1). Hệ thống sẽ tự động điều chỉnh độ khó bài đọc và từ vựng theo kết quả luyện tập của bạn.',
    aEn: 'The platform accommodates learners from absolute beginner (A1/A2) to advanced (B2/C1). Adaptive algorithms tailor reading passages and vocabulary difficulty to your progress.'
  },
  {
    qVi: 'Các lớp học và bài luyện tập là tự học hay tương tác trực tiếp?',
    qEn: 'Are the classes self-paced or live?',
    aVi: 'Bạn có thể tự học theo lộ trình 24/7 với phản hồi tức thì từ AI, đồng thời tham gia các phòng luyện viết và thảo luận cùng cộng đồng học viên.',
    aEn: 'You can learn self-paced 24/7 with immediate AI assistance, and participate in collaborative essay writing and interactive study sessions.'
  },
  {
    qVi: 'Thời lượng của mỗi khóa học thường kéo dài bao lâu?',
    qEn: 'How long does each course usually take?',
    aVi: 'Mỗi lộ trình được chia thành các vòng học vi mô từ 10-15 phút/ngày, giúp bạn hoàn thành một cấp độ sau 4-6 tuần học kiên trì.',
    aEn: 'Each pathway is structured into bite-sized 10-15 minute daily modules, enabling you to complete a full milestone in 4-6 weeks of consistent practice.'
  },
  {
    qVi: 'Nền tảng hỗ trợ những phương thức thanh toán nào?',
    qEn: 'What payment methods are supported?',
    aVi: 'Hệ thống hỗ trợ quét mã VietQR tự động qua tất cả các ứng dụng ngân hàng Việt Nam (PayOS), kích hoạt gói ngay sau vài giây.',
    aEn: 'We support automated VietQR instant transfers through PayOS across all major Vietnamese banking apps, activating your plan in seconds.'
  },
  {
    qVi: 'Tôi có nhận được chứng nhận sau khi hoàn thành khóa học không?',
    qEn: 'Do I get a certificate after finishing a course?',
    aVi: 'Có! Khi hoàn thành đầy đủ các bài tập từ vựng, viết luận và bài kiểm tra tiến độ, bạn sẽ nhận được chứng nhận hoàn thành chuẩn CEFR.',
    aEn: 'Yes! Upon completing all required vocabulary modules, writing prompts, and benchmark tests, you receive an accredited LexiGrow digital certificate.'
  },
  {
    qVi: 'Nếu tôi chưa tự tin nói và viết tiếng Anh thì có theo kịp không?',
    qEn: 'What if I’m not confident speaking English yet?',
    aVi: 'Đừng lo lắng! AI đóng vai trò như một người bạn đồng hành kiên nhẫn, không phán xét, luôn giải thích cặn kẽ và khuyến khích bạn tiến bộ từng ngày.',
    aEn: 'No worries! Our AI acts as a patient, judgment-free learning partner that provides gentle guidance, clear explanations, and daily encouragement.'
  }
]

export default function PricingPage() {
  const { user, isAuthenticated, selectedParentChildId } = useAuth()
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [plans, setPlans] = useState([])
  const [currentTierInfo, setCurrentTierInfo] = useState(null)
  const [activeTab, setActiveTab] = useState('student') // 'student' | 'teacher'
  const [billingCycle, setBillingCycle] = useState('monthly') // 'monthly' | 'yearly'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processingSlug, setProcessingSlug] = useState(null)

  // Parent beneficiary support
  const [parentChildren, setParentChildren] = useState([])
  const [selectedChildId, setSelectedChildId] = useState(() => searchParams.get('studentId') || selectedParentChildId || '')

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        setLoading(true)
        const plansData = await paymentService.getPlans()
        if (isMounted) {
          setPlans(Array.isArray(plansData) ? plansData : plansData.data || [])
        }

        if (isAuthenticated) {
          const subData = await paymentService.getMySubscription()
          if (isMounted && subData.success && subData.data) {
            setCurrentTierInfo(subData.data)
          }

          if (user?.role === 'parent') {
            try {
              const res = await api.get('/parent/children')
              const childrenList = Array.isArray(res.data) ? res.data : []
              if (isMounted) {
                setParentChildren(childrenList)
                setSelectedChildId(prev => prev || searchParams.get('studentId') || selectedParentChildId || childrenList[0]?._id || '')
              }
            } catch (pErr) {
              console.error('Failed to load parent children for pricing:', pErr)
            }
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message || t('pricing.fetchError', 'Could not load subscription plans.'))
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchData()
    return () => { isMounted = false }
  }, [isAuthenticated, user?.role, searchParams, selectedParentChildId, t])

  const handleSubscribe = async (planSlug) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/pricing', infoMessage: t('pricing.loginRequired', 'Please log in to purchase a plan.') } })
      return
    }

    try {
      setProcessingSlug(planSlug)
      setError(null)
      const selectedPlan = plans.find(p => p.slug === planSlug)
      let beneficiaryId = null

      if (user?.role === 'parent' && selectedPlan?.targetRole === 'student') {
        beneficiaryId = selectedChildId
        if (!beneficiaryId) {
          throw new Error(language === 'vi' ? 'Phụ huynh vui lòng chọn học sinh được thụ hưởng gói cước.' : 'Please select the student beneficiary for this plan.')
        }
      }

      const res = await paymentService.createPaymentLink(planSlug, billingCycle, beneficiaryId)
      if (res.success && res.data?.checkoutUrl) {
        window.location.assign(res.data.checkoutUrl)
      } else {
        throw new Error(res.message || t('pricing.checkoutError', 'Error creating PayOS payment link.'))
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
    if (match && match[language]) return match[language]
    return feat
  }

  const getTranslatedDesc = (plan) => {
    if (PLAN_DESCRIPTIONS[plan.slug] && PLAN_DESCRIPTIONS[plan.slug][language]) {
      return PLAN_DESCRIPTIONS[plan.slug][language]
    }
    return plan.description
  }

  const studentPlans = plans.filter((p) => p.targetRole === 'student')
  const teacherPlans = plans.filter((p) => p.targetRole === 'teacher')
  const activePlans = activeTab === 'student' ? studentPlans : teacherPlans

  return (
    <div className="eduvia-pricing-page">
      {/* ── BREADCRUMB HERO BANNER (Sky pastel blue) ── */}
      <section className="eduvia-page-hero">
        <h1 className="eduvia-page-hero__title">{language === 'vi' ? 'Bảng giá & Gói học' : 'Pricing Plans'}</h1>
        <p className="eduvia-page-hero__desc">
          {language === 'vi'
            ? 'Lựa chọn gói đồng hành thông minh cùng AI để tối ưu hóa lộ trình học tiếng Anh, mở rộng vốn từ và nâng cao kỹ năng viết luận của bạn.'
            : 'Choose the ideal AI-powered plan to accelerate your English vocabulary acquisition and master academic writing.'}
        </p>
        <div className="eduvia-breadcrumbs">
          <Link to="/student/home">{language === 'vi' ? 'Trang chủ' : 'Home'}</Link>
          <span className="eduvia-breadcrumbs__sep">·</span>
          <span>{language === 'vi' ? 'Bảng giá' : 'Pricing'}</span>
        </div>
      </section>

      <div className="eduvia-pricing-container">
        {/* Section Header */}
        <div className="eduvia-section-header">
          <div>
            <span className="eduvia-kicker eduvia-kicker--green">
              {language === 'vi' ? 'Bảng giá gói học' : 'Plan Pricing'}
            </span>
            <h2 className="eduvia-section-title">
              {language === 'vi' ? 'Chọn gói học phù hợp với mục tiêu của bạn' : 'Choose Plans That Fit Your Learning'}
            </h2>
          </div>
          <p className="eduvia-section-desc">
            {language === 'vi'
              ? 'Các gói học được thiết kế linh hoạt, phù hợp với học viên tự học, người luyện thi chứng chỉ và giáo viên quản lý lớp học.'
              : 'Flexible learning packages designed for self-study learners, exam candidates, and educator classrooms.'}
          </p>
        </div>

        {/* Audience and Cycle Controls */}
        <div className="eduvia-pricing-controls">
          <div className="eduvia-role-pills">
            <button
              type="button"
              className={`eduvia-role-pill ${activeTab === 'student' ? 'active' : ''}`}
              onClick={() => setActiveTab('student')}
            >
              <span className="material-symbols-outlined">school</span>
              <span>{language === 'vi' ? 'Học viên cá nhân' : 'For Students'}</span>
            </button>
            <button
              type="button"
              className={`eduvia-role-pill ${activeTab === 'teacher' ? 'active' : ''}`}
              onClick={() => setActiveTab('teacher')}
            >
              <span className="material-symbols-outlined">co_present</span>
              <span>{language === 'vi' ? 'Giáo viên & Lớp học' : 'For Teachers'}</span>
            </button>
          </div>

          <div className="eduvia-cycle-toggle">
            <span className={billingCycle === 'monthly' ? 'active' : ''}>{t('pricing.monthly', 'Hàng tháng')}</span>
            <button
              type="button"
              className={`eduvia-toggle-btn ${billingCycle === 'yearly' ? 'yearly' : ''}`}
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              aria-label="Toggle billing cycle"
            >
              <span className="eduvia-toggle-knob" />
            </button>
            <span className={billingCycle === 'yearly' ? 'active' : ''}>
              {t('pricing.yearly', 'Hàng năm')} <span className="eduvia-discount-pill">-20%</span>
            </span>
          </div>
        </div>

        {error && (
          <div className="eduvia-error-alert">
            <span className="material-symbols-outlined">error</span>
            <span>{error}</span>
          </div>
        )}

        {user?.role === 'parent' && activeTab === 'student' && (
          <div style={{
            background: 'var(--color-surface, #fff)',
            border: '1.5px solid var(--color-primary, #6366f1)',
            borderRadius: '16px',
            padding: '16px 20px',
            margin: '0 auto 32px',
            maxWidth: '680px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--color-primary, #6366f1)' }}>
                family_restroom
              </span>
              <div>
                <strong style={{ display: 'block', fontSize: '15px' }}>
                  {language === 'vi' ? 'Mua gói cho học sinh:' : 'Purchasing plan for student:'}
                </strong>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary, #64748b)' }}>
                  {parentChildren.length === 0
                    ? (language === 'vi' ? 'Bạn chưa liên kết tài khoản học sinh nào.' : 'You have not linked any students yet.')
                    : (language === 'vi' ? 'Gói học sẽ được kích hoạt trực tiếp cho học sinh được chọn.' : 'The subscription will be directly activated for the selected student.')}
                </span>
              </div>
            </div>

            {parentChildren.length > 0 ? (
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  background: 'var(--color-bg, #f8fafc)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'inherit',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {parentChildren.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.email || c.username || 'Student'})
                  </option>
                ))}
              </select>
            ) : (
              <Link
                to="/parent/dashboard?link=1"
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  background: 'var(--color-primary, #6366f1)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                {language === 'vi' ? '+ Liên kết học sinh' : '+ Link a student'}
              </Link>
            )}
          </div>
        )}

        {/* ── 3 PRICING CARDS ── */}
        {loading ? (
          <div className="eduvia-pricing-loading">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            <p>{t('common.loading', 'Đang tải bảng giá...')}</p>
          </div>
        ) : (
          <div className="eduvia-pricing-cards">
            {activePlans.map((plan, index) => {
              const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
              const formattedPrice = price.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')
              const isCurrent = currentTierInfo?.tier === plan.tier
              const isFeatured = plan.tier === 'pro' || index === 1

              return (
                <div key={plan.slug} className={`eduvia-price-card ${isFeatured ? 'eduvia-price-card--featured' : ''}`}>
                  <div className={`eduvia-price-card__header ${isFeatured ? 'eduvia-price-card__header--green' : 'eduvia-price-card__header--purple'}`}>
                    <span className="eduvia-price-card__plan-name">{plan.name.toUpperCase()}</span>
                    <div className="eduvia-price-card__amount">
                      <strong>{formattedPrice}</strong>
                      <span>{billingCycle === 'yearly' ? 'VND/year' : 'VND/month'}</span>
                    </div>
                    <p>{getTranslatedDesc(plan)}</p>
                    <button
                      type="button"
                      className="eduvia-btn eduvia-btn--lime eduvia-btn--full"
                      onClick={() => handleSubscribe(plan.slug)}
                      disabled={isCurrent || processingSlug === plan.slug}
                    >
                      {processingSlug === plan.slug ? (
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      ) : isCurrent ? (
                        t('pricing.currentPlan', 'Gói hiện tại')
                      ) : isFeatured ? (
                        language === 'vi' ? 'Chọn gói Pro' : 'Choose Pro Plan'
                      ) : (
                        language === 'vi' ? 'Chọn gói này' : 'Select Plan'
                      )}
                    </button>
                  </div>

                  <div className="eduvia-price-card__body">
                    <h4>{language === 'vi' ? 'Đặc quyền gói học:' : 'Included Benefits:'}</h4>
                    <ul className="eduvia-price-card__checklist">
                      {plan.features.map((feat, idx) => (
                        <li key={idx}>
                          <span className="material-symbols-outlined">check</span>
                          <span>{getTranslatedFeature(feat)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="eduvia-price-card__footer-note">
                      <strong>{isFeatured ? (language === 'vi' ? 'Gói phổ biến nhất' : 'Most popular plan') : (language === 'vi' ? 'Phù hợp người mới bắt đầu' : 'Best for starters')}</strong>
                      <p>{language === 'vi' ? 'Tiếp cận các học phần nâng cao, tính năng ôn tập thông minh và hỗ trợ xuyên suốt.' : 'Access advanced modules, intelligent revision tools, and continuous learning support.'}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── WHY CHOOSE US SECTION WITH VIDEO MOCKUP ── */}
        <section className="eduvia-why-section" style={{ marginTop: 80 }}>
          <div className="eduvia-center-header">
            <span className="eduvia-kicker eduvia-kicker--purple">{language === 'vi' ? 'Tại sao chọn LexiGrow' : 'Why Choose LexiGrow'}</span>
            <h2 className="eduvia-section-title">
              {language === 'vi' ? 'Học tiếng Anh nhanh hơn với phương pháp khoa học' : 'Learn English Faster With Better Guidance'}
            </h2>
          </div>

          <div className="eduvia-why-cards">
            <div className="eduvia-why-card">
              <span className="eduvia-why-card__icon"><span className="material-symbols-outlined">auto_fix_high</span></span>
              <h3>{language === 'vi' ? 'Trợ lý AI chấm bài viết tức thì' : 'Real-Time AI Writing Evaluation'}</h3>
              <p>{language === 'vi' ? 'Chấm điểm 4 tiêu chí chuẩn IELTS, phân tích lỗi ngữ pháp và đề xuất từ vựng học thuật.' : 'Evaluates essays against official criteria, catches subtle errors, and suggests academic collocations.'}</p>
            </div>
            <div className="eduvia-why-card">
              <span className="eduvia-why-card__icon"><span className="material-symbols-outlined">psychology</span></span>
              <h3>{language === 'vi' ? 'Spaced Repetition System (SRS)' : 'Spaced Repetition System'}</h3>
              <p>{language === 'vi' ? 'Thuật toán lặp lại ngắt quãng tính toán chu kỳ vàng, khắc sâu từ vựng vào trí nhớ dài hạn.' : 'Scientifically timed flashcard intervals prevent forgetting and ensure permanent word retention.'}</p>
            </div>
            <div className="eduvia-why-card">
              <span className="eduvia-why-card__icon"><span className="material-symbols-outlined">eco</span></span>
              <h3>{language === 'vi' ? 'Vườn tri thức & Học qua tương tác' : 'Growth Garden & Interactive Gamification'}</h3>
              <p>{language === 'vi' ? 'Thử thách giải ô chữ Vocab Hunter, chăm sóc cây tri thức và tích lũy huy hiệu học tập.' : 'Daily challenges, vocabulary games, and growth metrics that maintain motivation and consistency.'}</p>
            </div>
          </div>

          <div className="eduvia-video-container">
            <img src="/assets/lexigrow/writing-practice.webp" alt={language === 'vi' ? 'Học viên luyện viết tiếng Anh tại nhà' : 'Learner practising English writing at home'} className="eduvia-video-container__poster" />
            <button type="button" className="eduvia-video-container__play-btn" aria-label="Play video">
              <span className="material-symbols-outlined">play_arrow</span>
            </button>
          </div>
        </section>

        {/* ── 4 NUMBERED STEPS: SIMPLE STEPS TO START LEARNING ── */}
        <section className="eduvia-steps-section" style={{ marginTop: 80 }}>
          <div className="eduvia-section-header">
            <div>
              <span className="eduvia-kicker eduvia-kicker--mint">{language === 'vi' ? 'Quy trình học tập' : 'How It Works'}</span>
              <h2 className="eduvia-section-title">{language === 'vi' ? 'Bốn bước đơn giản để bắt đầu' : 'Simple Steps To Start Learning'}</h2>
            </div>
            <p className="eduvia-section-desc">
              {language === 'vi'
                ? 'Lộ trình rõ ràng, minh bạch giúp bạn làm quen nhanh chóng và đạt hiệu quả ngay từ buổi học đầu tiên.'
                : 'A transparent roadmap designed to onboard you smoothly and drive measurable outcomes.'}
            </p>
          </div>

          <div className="eduvia-steps-grid">
            <div className="eduvia-step-card">
              <span className="eduvia-step-num">01</span>
              <span className="eduvia-step-dot" />
              <h3>{language === 'vi' ? 'Chọn Gói Học' : 'Choose Plan'}</h3>
              <p>{language === 'vi' ? 'Lựa chọn gói tự học hoặc có người hướng dẫn phù hợp với ngân sách và mục tiêu của bạn.' : 'Pick a self-paced or mentored package aligned with your budget and learning objectives.'}</p>
              <Link to="/pricing" className="eduvia-step-link">{language === 'vi' ? 'Bắt đầu' : 'Start Here'}</Link>
            </div>
            <div className="eduvia-step-card">
              <span className="eduvia-step-num">02</span>
              <span className="eduvia-step-dot" />
              <h3>{language === 'vi' ? 'Thanh Toán PayOS' : 'Instant Activation'}</h3>
              <p>{language === 'vi' ? 'Quét mã VietQR chuyển khoản nhanh, tài khoản được nâng cấp tự động chỉ sau 3 giây.' : 'Scan automated VietQR via banking app, instant confirmation and account unlock.'}</p>
              <Link to="/pricing" className="eduvia-step-link">{language === 'vi' ? 'Kích hoạt ngay' : 'Enroll Now'}</Link>
            </div>
            <div className="eduvia-step-card">
              <span className="eduvia-step-num">03</span>
              <span className="eduvia-step-dot" />
              <h3>{language === 'vi' ? 'Luyện Tập Hàng Ngày' : 'Learn & Practice'}</h3>
              <p>{language === 'vi' ? 'Luyện viết luận, ôn thẻ từ vựng SRS và thực hành các bài tập phản xạ tương tác.' : 'Write essays, practice SRS flashcard reviews, and complete interactive skill modules.'}</p>
              <Link to="/student/explore" className="eduvia-step-link">{language === 'vi' ? 'Luyện tập' : 'Start Practice'}</Link>
            </div>
            <div className="eduvia-step-card">
              <span className="eduvia-step-num">04</span>
              <span className="eduvia-step-dot" />
              <h3>{language === 'vi' ? 'Theo Dõi Tiến Bộ' : 'Track Progress'}</h3>
              <p>{language === 'vi' ? 'Theo dõi biểu đồ điểm số, mức độ làm chủ từ vựng và nhận chứng chỉ LexiGrow.' : 'Inspect detailed score progression, vocabulary retention metrics, and earning certificates.'}</p>
              <Link to="/student/progress" className="eduvia-step-link">{language === 'vi' ? 'Xem tiến độ' : 'View Progress'}</Link>
            </div>
          </div>
        </section>

        {/* ── DARK CTA BANNER ── */}
        <section className="eduvia-dark-cta" style={{ marginTop: 80 }}>
          <div className="eduvia-dark-cta__inner">
            <span className="eduvia-dark-cta__kicker">{language === 'vi' ? 'Tại sao chọn LexiGrow' : 'Why Choose LexiGrow'}</span>
            <h2>{language === 'vi' ? 'Bắt đầu hành trình bứt phá tiếng Anh cùng LexiGrow' : 'Begin Your English Journey With Confidence'}</h2>
            <p>
              {language === 'vi'
                ? 'Đầu tư cho năng lực tiếng Anh hôm nay để mở ra vô vàn cơ hội học tập và sự nghiệp trong tương lai cùng LexiGrow.'
                : 'Invest in your English fluency today to unlock vast educational and career opportunities with LexiGrow.'}
            </p>
            <div className="eduvia-dark-cta__actions">
              <Link to={user ? '/student/dashboard' : '/register'} className="eduvia-btn eduvia-btn--lime">
                {language === 'vi' ? 'Bắt đầu ngay' : 'Get Started'}
              </Link>
              <Link to="/student/explore" className="eduvia-btn eduvia-btn--mint">
                {language === 'vi' ? 'Khám phá khóa học' : 'Explore Courses'}
              </Link>
            </div>
          </div>
        </section>

        {/* ── FAQ ACCORDION SECTION (ANSWERS TO YOUR COMMON QUESTIONS) ── */}
        <section className="eduvia-faq-section" style={{ marginTop: 80 }}>
          <div className="eduvia-section-header">
            <div>
              <span className="eduvia-kicker eduvia-kicker--mint">{language === 'vi' ? 'Câu hỏi thường gặp' : 'FAQs'}</span>
              <h2 className="eduvia-section-title">{language === 'vi' ? 'Giải đáp thắc mắc về các gói học' : 'Answers To Your Common Questions'}</h2>
            </div>
            <Link to="/contact" className="eduvia-btn eduvia-btn--mint">
              {language === 'vi' ? 'Hỗ trợ & Liên hệ' : 'Contact Support'}
            </Link>
          </div>

          <div className="eduvia-faq-grid">
            {FAQ_ITEMS.map((item, idx) => (
              <div className="eduvia-faq-item" key={idx}>
                <div className="eduvia-faq-item__header">
                  <span className="eduvia-faq-icon material-symbols-outlined">subdirectory_arrow_right</span>
                  <h4>{language === 'vi' ? item.qVi : item.qEn}</h4>
                </div>
                <p>{language === 'vi' ? item.aVi : item.aEn}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
