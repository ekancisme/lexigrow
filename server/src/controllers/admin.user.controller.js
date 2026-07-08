import User from '../models/User.js'
import bcrypt from 'bcryptjs'
import asyncHandler from '../utils/asyncHandler.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import sendEmail from '../utils/sendEmail.js'

/* ── Helpers ─────────────────────────────────────────────── */
function sanitize(user) {
  const obj = user.toObject ? user.toObject() : { ...user }
  delete obj.password
  delete obj.resetPasswordCode
  return obj
}

// ─────────────────────────────────────────────────────────────
// GET /api/admin/users
// Query: page, limit, search, role, status
// ─────────────────────────────────────────────────────────────
export const getUsers = asyncHandler(async (req, res) => {
  const { search = '', role, status, page = 1, limit = 20 } = req.query
  const query = {}

  if (search) {
    query.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ]
  }
  if (role   && role   !== 'all') query.role          = role
  if (status && status !== 'all') query.accountStatus = status

  const skip  = (Number(page) - 1) * Number(limit)
  const total = await User.countDocuments(query)

  const users = await User.find(query)
    .select('-password -resetPasswordCode')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))

  // Summary counts (always over the full dataset, not the filtered one)
  const [byRole, byStatus] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role',          count: { $sum: 1 } } }]),
    User.aggregate([{ $group: { _id: '$accountStatus', count: { $sum: 1 } } }]),
  ])

  const roleCounts   = Object.fromEntries(byRole.map(r  => [r._id,  r.count]))
  const statusCounts = Object.fromEntries(byStatus.map(s => [s._id, s.count]))

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: users,
    summary: { roleCounts, statusCounts },
  })
})

// ─────────────────────────────────────────────────────────────
// GET /api/admin/users/:id
// ─────────────────────────────────────────────────────────────
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password -resetPasswordCode')
    .populate('children', 'name email')
    .populate('parents',  'name email')

  if (!user) throw new ErrorResponse('User not found', 404)

  res.status(200).json({ success: true, data: user })
})

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/users/:id/status
// body: { status: 'active'|'suspended'|'rejected', note? }
// ─────────────────────────────────────────────────────────────
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { status, note = '' } = req.body
  const VALID = ['active', 'suspended', 'pending_approval', 'rejected']
  if (!VALID.includes(status)) throw new ErrorResponse('Invalid status value', 400)

  const user = await User.findById(req.params.id)
  if (!user) throw new ErrorResponse('User not found', 404)
  if (user.role === 'admin') throw new ErrorResponse('Cannot change status of an admin account', 403)

  const oldStatus   = user.accountStatus
  user.accountStatus = status
  user.statusNote    = note
  await user.save()

  console.log(`[ADMIN] ${req.user.name} changed ${user.email} status: ${oldStatus} → ${status}`)

  res.status(200).json({ success: true, data: sanitize(user) })
})

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/users/:id/role
// body: { role: 'student'|'teacher'|'parent' }
// ─────────────────────────────────────────────────────────────
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body
  if (!['student', 'teacher', 'parent', 'admin'].includes(role)) {
    throw new ErrorResponse('Invalid role', 400)
  }

  const user = await User.findById(req.params.id)
  if (!user) throw new ErrorResponse('User not found', 404)

  const oldRole  = user.role
  user.role = role
  await user.save()

  console.log(`[ADMIN] ${req.user.name} changed ${user.email} role: ${oldRole} → ${role}`)

  res.status(200).json({ success: true, data: sanitize(user) })
})

// ─────────────────────────────────────────────────────────────
// POST /api/admin/users/:id/reset-password
// body: { newPassword }
// ─────────────────────────────────────────────────────────────
export const resetUserPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body
  if (!newPassword || newPassword.length < 6) {
    throw new ErrorResponse('Password must be at least 6 characters', 400)
  }

  const user = await User.findById(req.params.id).select('+password')
  if (!user) throw new ErrorResponse('User not found', 404)

  user.password = newPassword // pre-save hook will hash it
  await user.save()

  console.log(`[ADMIN] ${req.user.name} reset password for ${user.email}`)

  res.status(200).json({ success: true, message: 'Password has been reset successfully' })
})

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/users/:id
// ─────────────────────────────────────────────────────────────
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) throw new ErrorResponse('User not found', 404)
  if (user.role === 'admin') throw new ErrorResponse('Cannot delete an admin account', 403)
  if (user._id.toString() === req.user._id.toString()) {
    throw new ErrorResponse('Cannot delete your own account', 403)
  }

  await user.deleteOne()

  console.log(`[ADMIN] ${req.user.name} deleted user ${user.email}`)

  res.status(200).json({ success: true, message: 'User deleted successfully' })
})

// ─────────────────────────────────────────────────────────────
// GET /api/admin/approvals
// Lists all users with accountStatus = 'pending_approval'
// ─────────────────────────────────────────────────────────────
export const getPendingApprovals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30, role } = req.query
  const query = { accountStatus: 'pending_approval' }
  if (role && role !== 'all') query.role = role

  const skip  = (Number(page) - 1) * Number(limit)
  const total = await User.countDocuments(query)
  const users = await User.find(query)
    .select('-password -resetPasswordCode')
    .sort({ createdAt: 1 }) // oldest first — FIFO
    .skip(skip)
    .limit(Number(limit))

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    data: users,
  })
})

// ─────────────────────────────────────────────────────────────
// POST /api/admin/approvals/:id/approve
// ─────────────────────────────────────────────────────────────
export const approveUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) throw new ErrorResponse('User not found', 404)
  if (user.accountStatus !== 'pending_approval') {
    throw new ErrorResponse('User is not in pending_approval status', 400)
  }

  user.accountStatus = 'active'
  user.statusNote    = `Approved by ${req.user.name} on ${new Date().toISOString()}`
  await user.save()

  // Send approval email
  try {
    await sendEmail({
      email:   user.email,
      subject: '[LexiGrow] Tài khoản của bạn đã được phê duyệt!',
      message: `Xin chào ${user.name}, tài khoản ${user.role} của bạn trên LexiGrow đã được Admin phê duyệt. Bạn có thể đăng nhập ngay bây giờ.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e0e7ff;border-radius:12px">
          <h2 style="color:#005bbf;text-align:center">✅ Tài khoản đã được duyệt!</h2>
          <p>Xin chào <strong>${user.name}</strong>,</p>
          <p>Tài khoản <strong>${user.role}</strong> của bạn trên hệ thống <strong>LexiGrow</strong> đã được Admin phê duyệt thành công.</p>
          <p>Bạn có thể đăng nhập và bắt đầu sử dụng hệ thống ngay bây giờ.</p>
          <div style="text-align:center;margin:24px 0">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" 
               style="background:#005bbf;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700">
              Đăng nhập ngay
            </a>
          </div>
          <hr style="border:0;border-top:1px solid #eee;margin:20px 0"/>
          <p style="color:#999;font-size:12px;text-align:center">LexiGrow © 2026 - Measured Writing Growth</p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[ADMIN] Failed to send approval email:', err.message)
    // Non-blocking: approval still succeeds
  }

  console.log(`[ADMIN] ${req.user.name} APPROVED ${user.email} (${user.role})`)

  res.status(200).json({ success: true, data: sanitize(user) })
})

// ─────────────────────────────────────────────────────────────
// POST /api/admin/approvals/:id/reject
// body: { reason? }
// ─────────────────────────────────────────────────────────────
export const rejectUser = asyncHandler(async (req, res) => {
  const { reason = 'Không đáp ứng yêu cầu của hệ thống.' } = req.body

  const user = await User.findById(req.params.id)
  if (!user) throw new ErrorResponse('User not found', 404)
  if (user.accountStatus !== 'pending_approval') {
    throw new ErrorResponse('User is not in pending_approval status', 400)
  }

  user.accountStatus = 'rejected'
  user.statusNote    = `Rejected by ${req.user.name}: ${reason}`
  await user.save()

  // Send rejection email
  try {
    await sendEmail({
      email:   user.email,
      subject: '[LexiGrow] Đơn đăng ký tài khoản không được chấp nhận',
      message: `Xin chào ${user.name}, đơn đăng ký tài khoản của bạn đã bị từ chối. Lý do: ${reason}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #fde8e8;border-radius:12px">
          <h2 style="color:#ba1a1a;text-align:center">❌ Đơn đăng ký không được chấp nhận</h2>
          <p>Xin chào <strong>${user.name}</strong>,</p>
          <p>Chúng tôi rất tiếc phải thông báo rằng đơn đăng ký tài khoản <strong>${user.role}</strong> của bạn trên LexiGrow không được chấp nhận.</p>
          <div style="background:#fff3f3;border-left:4px solid #ba1a1a;padding:12px 16px;border-radius:6px;margin:16px 0">
            <strong>Lý do:</strong> ${reason}
          </div>
          <p>Nếu bạn cho rằng có sự nhầm lẫn, vui lòng liên hệ với chúng tôi để được hỗ trợ.</p>
          <hr style="border:0;border-top:1px solid #eee;margin:20px 0"/>
          <p style="color:#999;font-size:12px;text-align:center">LexiGrow © 2026 - Measured Writing Growth</p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[ADMIN] Failed to send rejection email:', err.message)
  }

  console.log(`[ADMIN] ${req.user.name} REJECTED ${user.email} (${user.role}). Reason: ${reason}`)

  res.status(200).json({ success: true, data: sanitize(user) })
})
