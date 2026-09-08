import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

import connectDB from '../src/config/db.js'
import SubscriptionPlan from '../src/models/SubscriptionPlan.js'

const plansData = [
  // ── STUDENT PLANS ───────────────────────────────────────────
  {
    slug: 'student-plus',
    name: 'Student Plus',
    targetRole: 'student',
    tier: 'plus',
    description: 'Nâng cao vốn từ và tốc độ viết luận với trợ lý AI.',
    monthlyPrice: 59000,
    yearlyPrice: 499000,
    features: [
      '15 bài chấm & sửa luận AI mỗi ngày',
      'Mở khóa toàn bộ Flashcard SRS & Vườn Tri Thức',
      'Tham gia không giới hạn số lớp học',
      'Theo dõi chi tiết biểu đồ từ vựng chủ động',
      'Hỗ trợ phản hồi AI chuẩn khung CEFR A2-B2',
    ],
    dailyAiEssayLimit: 15,
    maxSponsoredStudents: 0,
    maxClasses: 99,
    highlightBadge: '',
    sortOrder: 1,
    isActive: true,
  },
  {
    slug: 'student-pro',
    name: 'Student Pro',
    targetRole: 'student',
    tier: 'pro',
    description: 'Chinh phục IELTS & Viết luận học thuật đỉnh cao.',
    monthlyPrice: 99000,
    yearlyPrice: 799000,
    features: [
      'Không giới hạn bài viết luận & phân tích AI',
      'Đánh giá 4 tiêu chí chuẩn IELTS Band 8.5+',
      'Gợi ý nâng cấp từ vựng Collocations & Ngữ pháp nâng cao',
      'So sánh tiến độ giữa các bản sửa (Revision Compare)',
      'Xuất báo cáo học tập PDF chuyên nghiệp',
      'Ưu tiên tốc độ phản hồi AI siêu tốc',
    ],
    dailyAiEssayLimit: 9999,
    maxSponsoredStudents: 0,
    maxClasses: 99,
    highlightBadge: 'Phổ biến nhất',
    sortOrder: 2,
    isActive: true,
  },
  {
    slug: 'student-ultra',
    name: 'Student Ultra',
    targetRole: 'student',
    tier: 'ultra',
    description: 'Trải nghiệm học tập cá nhân hóa với gia sư AI 1-on-1.',
    monthlyPrice: 169000,
    yearlyPrice: 1299000,
    features: [
      'Toàn bộ quyền lợi của gói Student Pro',
      'Trợ lý Gia sư AI 1-on-1 tương tác đàm thoại trực tiếp',
      'Phân tích phong cách diễn đạt & Tính mạch lạc chuyên sâu',
      'Luyện viết theo chủ đề bài thi thực chiến',
      'Băng thông AI ưu tiên cao nhất, không nghẽn giờ cao điểm',
      'Hỗ trợ kỹ thuật 24/7 từ chuyên viên học thuật',
    ],
    dailyAiEssayLimit: 9999,
    maxSponsoredStudents: 0,
    maxClasses: 99,
    highlightBadge: 'Đỉnh cao AI',
    sortOrder: 3,
    isActive: true,
  },

  // ── TEACHER PLANS (SPONSORSHIP TIERS) ────────────────────────
  {
    slug: 'teacher-plus',
    name: 'Teacher Plus',
    targetRole: 'teacher',
    tier: 'plus',
    description: 'Dành cho giáo viên / gia sư quản lý các lớp học nhỏ.',
    monthlyPrice: 199000,
    yearlyPrice: 1790000,
    features: [
      'Bảo trợ miễn phí cho tối đa 30 học sinh (dùng quyền Plus)',
      'Tạo tối đa 3 lớp học trực tuyến',
      'Giao bài tập kèm từ khóa mục tiêu không giới hạn',
      'Theo dõi tình trạng nộp bài và chấm điểm thủ công',
      'Học sinh trong lớp không cần mua gói dịch vụ',
    ],
    maxSponsoredStudents: 30,
    maxClasses: 3,
    dailyAiEssayLimit: 9999,
    highlightBadge: '',
    sortOrder: 4,
    isActive: true,
  },
  {
    slug: 'teacher-pro',
    name: 'Teacher Pro',
    targetRole: 'teacher',
    tier: 'pro',
    description: 'Dành cho giáo viên chuyên nghiệp & Trung tâm quy mô vừa.',
    monthlyPrice: 499000,
    yearlyPrice: 4490000,
    features: [
      'Bảo trợ miễn phí cho tối đa 100 học sinh (dùng quyền Pro)',
      'Tạo tối đa 10 lớp học trực tuyến',
      '100 học sinh được sử dụng không giới hạn bài viết AI',
      'Bảng điều khiển Class Analytics: Phổ điểm & Từ hay dùng sai',
      'Xuất bảng điểm và báo cáo học tập cả lớp dạng Excel/PDF',
      'Hỗ trợ quản lý trợ giảng và cộng tác viên',
    ],
    maxSponsoredStudents: 100,
    maxClasses: 10,
    dailyAiEssayLimit: 9999,
    highlightBadge: 'Khuyên dùng cho GV',
    sortOrder: 5,
    isActive: true,
  },
  {
    slug: 'teacher-ultra',
    name: 'Teacher Ultra',
    targetRole: 'teacher',
    tier: 'ultra',
    description: 'Giải pháp toàn diện cho Trung tâm Ngoại ngữ & Trường học.',
    monthlyPrice: 999000,
    yearlyPrice: 8990000,
    features: [
      'Bảo trợ miễn phí cho 300+ học sinh (dùng quyền Ultra)',
      'Không giới hạn số lượng lớp học tạo mới',
      'Toàn bộ học sinh được mở khóa Trợ lý AI Gia sư 1-on-1',
      'Phân tích học tập AI toàn diện cho cả trung tâm',
      'Tùy biến bộ tiêu chí chấm điểm và ngân hàng đề riêng',
      'Ưu tiên hỗ trợ kỹ thuật VIP & Đào tạo sử dụng chuyên biệt',
    ],
    maxSponsoredStudents: 300,
    maxClasses: 99,
    dailyAiEssayLimit: 9999,
    highlightBadge: 'Dành cho Trung tâm',
    sortOrder: 6,
    isActive: true,
  },
]

async function seedPlans() {
  try {
    console.log('🚀 Connecting to MongoDB...')
    await connectDB()
    console.log('🌱 Seeding Subscription Plans...')

    for (const plan of plansData) {
      await SubscriptionPlan.findOneAndUpdate(
        { slug: plan.slug },
        { $set: plan },
        { upsert: true, returnDocument: 'after' }
      )
      console.log(`   ✅ Plan: ${plan.name} (${plan.targetRole}) - ${plan.monthlyPrice.toLocaleString('vi-VN')}đ/tháng`)
    }

    console.log(`\n🎉 SEEDED ${plansData.length} SUBSCRIPTION PLANS SUCCESSFULLY!`)
    process.exit(0)
  } catch (err) {
    console.error('❌ Error seeding plans:', err)
    process.exit(1)
  }
}

seedPlans()
