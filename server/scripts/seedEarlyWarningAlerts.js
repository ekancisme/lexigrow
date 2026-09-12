import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

import connectDB from '../src/config/db.js'
import User from '../src/models/User.js'
import Class from '../src/models/Class.js'
import Alert from '../src/models/Alert.js'
import Notification from '../src/models/Notification.js'

async function seedEarlyWarningAlerts() {
  try {
    console.log('🚀 Connecting to MongoDB...')
    await connectDB()
    console.log('✅ Connected to MongoDB.')

    // 1. Ensure we have demo students
    const demoStudentsData = [
      {
        name: 'Nguyễn Văn Minh',
        email: 'student@lexigrow.com',
        englishLevel: 'B1',
        interests: ['Technology', 'Environment'],
      },
      {
        name: 'Trần Mai Linh',
        email: 'linh.tran@lexigrow.com',
        englishLevel: 'A2',
        interests: ['Daily Life', 'Travel'],
      },
      {
        name: 'Lê Đức Hoàng',
        email: 'hoang.duc@lexigrow.com',
        englishLevel: 'B2',
        interests: ['Science', 'Academic Writing'],
      },
      {
        name: 'Phạm Bảo Anh',
        email: 'bao.anh@lexigrow.com',
        englishLevel: 'B1',
        interests: ['Culture', 'Literature'],
      },
      {
        name: 'Đỗ Lan Hương',
        email: 'lan.huong@lexigrow.com',
        englishLevel: 'A2',
        interests: ['Communication', 'Business'],
      },
    ]

    const studentDocs = []
    for (const sData of demoStudentsData) {
      let st = await User.findOne({ email: sData.email })
      if (!st) {
        st = await User.create({
          name: sData.name,
          email: sData.email,
          password: 'password123',
          role: 'student',
          englishLevel: sData.englishLevel,
          learningProfile: {
            interests: sData.interests,
            targetLevel: 'B2',
            dailyGoalMinutes: 20,
            onboardingCompleted: true,
            timezone: 'Asia/Ho_Chi_Minh',
          },
          accountStatus: 'active',
        })
      }
      studentDocs.push(st)
    }
    console.log(`👨‍🎓 Verified ${studentDocs.length} demo students.`)

    // 2. Find all teachers
    let teachers = await User.find({ role: 'teacher' })
    if (teachers.length === 0) {
      const newTeacher = await User.create({
        name: 'Cô Hoàng Mai',
        email: 'teacher@lexigrow.com',
        password: 'password123',
        role: 'teacher',
        institution: 'Hanoi University of Foreign Studies',
        accountStatus: 'active',
      })
      teachers = [newTeacher]
    }
    console.log(`👩‍🏫 Found ${teachers.length} teacher(s): ${teachers.map(t => t.email).join(', ')}`)

    const now = Date.now()
    const hoursAgo = (h) => new Date(now - h * 3600 * 1000)
    const daysAgo = (d) => new Date(now - d * 86400 * 1000)

    let totalAlertsSeeded = 0

    for (const teacher of teachers) {
      console.log(`\n--- Processing Teacher: ${teacher.name} (${teacher.email}) ---`)

      // Ensure teacher has at least 2 active classes
      let teacherClasses = await Class.find({ teacher: teacher._id, status: 'active' })
      if (teacherClasses.length === 0) {
        const c1 = await Class.create({
          name: 'IELTS Foundation & Academic Writing A2-B1',
          description: 'Lớp học nâng cao vốn từ vựng học thuật, viết luận chủ đề đời sống và công nghệ.',
          schedule: 'Thứ 2 - Thứ 4 - Thứ 6 (19:30 - 21:00)',
          status: 'active',
          teacher: teacher._id,
          students: studentDocs.slice(0, 3).map((s) => s._id),
          code: `EWA-${Math.floor(1000 + Math.random() * 9000)}`,
        })
        const c2 = await Class.create({
          name: 'Tiếng Anh Thực Chiến & Diễn Đạt Tự Nhiên B1-B2',
          description: 'Rèn luyện kỹ năng viết câu phức, mở rộng collocation và phản xạ viết luận.',
          schedule: 'Thứ 3 - Thứ 5 - Thứ 7 (20:00 - 21:30)',
          status: 'active',
          teacher: teacher._id,
          students: studentDocs.slice(2).map((s) => s._id),
          code: `EWA-${Math.floor(1000 + Math.random() * 9000)}`,
        })
        teacherClasses = [c1, c2]
      } else {
        // Ensure demo students are enrolled in the teacher's classes
        for (let i = 0; i < teacherClasses.length; i++) {
          const cls = teacherClasses[i]
          const existingStudents = (cls.students || []).map(id => id.toString())
          const newStudents = studentDocs.map(s => s._id.toString())
          cls.students = Array.from(new Set([...existingStudents, ...newStudents]))
          await cls.save()
        }
      }

      const class1 = teacherClasses[0]
      const class2 = teacherClasses[1] || teacherClasses[0]

      // Clear existing alerts for this teacher
      await Alert.deleteMany({ teacher: teacher._id })

      const alertsToSeed = [
        {
          student: studentDocs[0]._id, // Nguyễn Văn Minh
          class: class1._id,
          teacher: teacher._id,
          type: 'critical',
          metric: 'vocabulary_stagnation',
          detail: 'Học sinh không ghi nhận thêm từ vựng mới nào trong 4 tuần liên tiếp (0 từ mới). Tốc độ phát triển vốn từ đang bị đình trệ nghiêm trọng.',
          icon: 'warning',
          isRead: false,
          isResolved: false,
          createdAt: hoursAgo(2),
        },
        {
          student: studentDocs[1]._id, // Trần Mai Linh
          class: class1._id,
          teacher: teacher._id,
          type: 'critical',
          metric: 'overall_score_decline',
          detail: 'Điểm bài luận trung bình giảm liên tục qua 3 bài nộp gần nhất (từ 7.0 ➔ 6.0 ➔ 5.0, giảm tổng cộng -2.0 điểm). Cần giáo viên can thiệp hướng dẫn phương pháp viết.',
          icon: 'trending_down',
          isRead: false,
          isResolved: false,
          createdAt: hoursAgo(5),
        },
        {
          student: studentDocs[3]._id, // Phạm Bảo Anh
          class: class2._id,
          teacher: teacher._id,
          type: 'warning',
          metric: 'grammar_decline',
          detail: 'Tỷ lệ chính xác ngữ pháp trong các bài viết gần đây giảm từ 82% xuống 61%. Học sinh thường xuyên mắc lỗi thì quá khứ hoàn thành và câu điều kiện loại 2.',
          icon: 'assignment_late',
          isRead: false,
          isResolved: false,
          createdAt: daysAgo(1),
        },
        {
          student: studentDocs[4]._id, // Đỗ Lan Hương
          class: class2._id,
          teacher: teacher._id,
          type: 'warning',
          metric: 'missed_assignment_deadline',
          detail: 'Đã quá hạn nộp bài tập "Writing Task 2: Technology in Modern Education" 3 ngày nhưng học sinh vẫn chưa gửi bản nháp hoặc bài nộp chính thức.',
          icon: 'schedule',
          isRead: true,
          isResolved: false,
          createdAt: daysAgo(2),
        },
        {
          student: studentDocs[2]._id, // Lê Đức Hoàng
          class: class1._id,
          teacher: teacher._id,
          type: 'warning',
          metric: 'vocabulary_diversity_drop',
          detail: 'Chỉ số đa dạng từ vựng (TTR) ở 2 bài luận gần nhất dưới mức chuẩn 0.45. Bài viết lặp lại các từ cơ bản A1-A2 và thiếu liên kết câu mạch lạc.',
          icon: 'menu_book',
          isRead: true,
          isResolved: false,
          createdAt: daysAgo(3),
        },
        {
          student: studentDocs[1]._id, // Trần Mai Linh
          class: class1._id,
          teacher: teacher._id,
          type: 'info',
          metric: 'study_inactivity',
          detail: 'Học sinh không có hoạt động học tập hoặc làm bài tập trong 7 ngày qua. Thời lượng hoàn thành mục tiêu tuần chỉ đạt 5/60 phút.',
          icon: 'info',
          isRead: true,
          isResolved: false,
          createdAt: daysAgo(4),
        },
        {
          student: studentDocs[0]._id, // Nguyễn Văn Minh
          class: class1._id,
          teacher: teacher._id,
          type: 'critical',
          metric: 'missed_assignment_deadline',
          detail: 'Chưa hoàn thành bài tập bắt buộc "Writing Task 1: My Daily Routine & Productivity" đã quá hạn 5 ngày.',
          icon: 'warning',
          isRead: true,
          isResolved: false,
          createdAt: daysAgo(5),
        },
        {
          student: studentDocs[3]._id, // Phạm Bảo Anh
          class: class2._id,
          teacher: teacher._id,
          type: 'success',
          metric: 'vocabulary_stagnation',
          detail: 'Học sinh đã khắc phục tình trạng đình trệ: Hoàn thành thêm 25 từ vựng mới thuộc chủ đề Môi trường & Đô thị và nộp bài luận xuất sắc đạt 8.0 điểm.',
          icon: 'check_circle',
          isRead: true,
          isResolved: true,
          createdAt: daysAgo(6),
        },
        {
          student: studentDocs[2]._id, // Lê Đức Hoàng
          class: class2._id,
          teacher: teacher._id,
          type: 'success',
          metric: 'grammar_decline',
          detail: 'Giáo viên đã hỗ trợ sửa lỗi cấu trúc câu: Tỷ lệ câu ngữ pháp phức đạt chuẩn đã tăng từ 55% lên 88% ở bài luận nộp lại.',
          icon: 'verified',
          isRead: true,
          isResolved: true,
          createdAt: daysAgo(8),
        },
      ]

      const created = await Alert.insertMany(alertsToSeed)
      totalAlertsSeeded += created.length

      // Seed unread notifications in Teacher's inbox
      const unreadAlerts = created.filter((a) => !a.isRead && !a.isResolved)
      for (const alert of unreadAlerts) {
        const studentName = studentDocs.find((s) => s._id.equals(alert.student))?.name || 'Học sinh'
        await Notification.create({
          recipient: teacher._id,
          sender: alert.student,
          title: `Cảnh báo học tập: ${studentName}`,
          message: alert.detail,
          type: 'academic_alert',
          link: '/teacher/alerts',
          isRead: false,
          alert: alert._id,
          createdAt: alert.createdAt,
        })
      }
      console.log(`✅ Seeded ${created.length} alerts and ${unreadAlerts.length} notifications for ${teacher.email}.`)
    }

    console.log('\n==================================================')
    console.log('🎉 SEED DỮ LIỆU CẢNH BÁO SỚM (EARLY WARNING) THÀNH CÔNG!')
    console.log(`👩‍🏫 Đã cập nhật cho ${teachers.length} tài khoản Giáo viên.`)
    console.log(`🚨 Tổng số cảnh báo đã tạo: ${totalAlertsSeeded}`)
    console.log('🌐 Kiểm tra trên UI: /teacher/alerts')
    console.log('==================================================\n')

    process.exit(0)
  } catch (err) {
    console.error('❌ Error seeding early warning alerts:', err)
    process.exit(1)
  }
}

seedEarlyWarningAlerts()
