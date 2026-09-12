import Class from '../models/Class.js'
import Essay from '../models/Essay.js'

const idOf = (value) => {
  if (!value) return null
  const raw = value._id ? value._id : value
  return typeof raw === 'string' ? raw : raw.toString()
}

/**
 * LG-05 / LG-06 / LG-07 / LG-08 / LG-09
 * Centralised object-level authorization (BOLA/IDOR) for essay access.
 *
 * Rules:
 *  - admin   : always true
 *  - student : only their own essay
 *  - teacher : only if an active class of theirs contains the essay's student
 *  - parent  : only if the essay's student is one of their children
 *  - others  : false
 *
 * @param {{_id: any, role: string, children?: any[]}} user
 * @param {{student: any}} essay
 * @returns {Promise<boolean>}
 */
export const canAccessEssay = async (user, essay) => {
  if (!user || !essay) return false
  const studentId = idOf(essay.student)
  if (!studentId) return false

  switch (user.role) {
    case 'admin':
      return true
    case 'student':
      return studentId === idOf(user._id)
    case 'teacher':
      return Boolean(
        await Class.exists({
          teacher: user._id,
          students: studentId,
          status: 'active',
        })
      )
    case 'parent':
      return (
        Array.isArray(user.children) &&
        user.children.some((childId) => idOf(childId) === studentId)
      )
    default:
      return false
  }
}

/**
 * LG-15: build a Mongo filter that limits an essay *list* query to what `user`
 * is allowed to read. Returns null when the user has no essay visibility at all.
 *
 * @param {{_id: any, role: string, children?: any[]}} user
 * @returns {Promise<object|null>}
 */
export const essayVisibilityFilter = async (user) => {
  if (!user) return null

  switch (user.role) {
    case 'admin':
      return {}
    case 'student':
      return { student: user._id }
    case 'teacher': {
      const classes = await Class.find({ teacher: user._id, status: 'active' })
        .select('students')
        .lean()
      const studentIds = classes.flatMap((cls) => cls.students || [])
      return { student: { $in: studentIds } }
    }
    case 'parent':
      return { student: { $in: Array.isArray(user.children) ? user.children : [] } }
    default:
      return null
  }
}

/**
 * LG-10 / LG-11: decide whether a user may join / read a chat room.
 * Supported room shapes:
 *  - 'support'            : any authenticated user
 *  - 'user:<id>'          : the owner (admins also pass)
 *  - 'class:<classId>'    : the class teacher, a student of the class, or a parent of one
 *  - 'essay:<essayId>'    : same rules as essay access
 * Unknown room shapes are denied for non-admins.
 *
 * @param {{_id: any, role: string, children?: any[]}} user
 * @param {string} room
 * @returns {Promise<boolean>}
 */
export const canAccessChatRoom = async (user, room) => {
  if (!user || typeof room !== 'string' || !room) return false
  if (user.role === 'admin') return true
  if (room === 'support') return true

  const separatorIndex = room.indexOf(':')
  if (separatorIndex === -1) return false

  const prefix = room.slice(0, separatorIndex)
  const rawId = room.slice(separatorIndex + 1)

  if (prefix === 'user') {
    return rawId === idOf(user._id)
  }

  if (prefix === 'class') {
    if (user.role === 'teacher') {
      return Boolean(await Class.exists({ _id: rawId, teacher: user._id }))
    }
    if (user.role === 'student') {
      return Boolean(await Class.exists({ _id: rawId, students: user._id }))
    }
    if (user.role === 'parent') {
      const children = Array.isArray(user.children) ? user.children : []
      return Boolean(await Class.exists({ _id: rawId, students: { $in: children } }))
    }
    return false
  }

  if (prefix === 'essay') {
    const essay = await Essay.findById(rawId).select('student')
    return canAccessEssay(user, essay)
  }

  return false
}