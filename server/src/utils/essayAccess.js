import Class from '../models/Class.js'
import Essay from '../models/Essay.js'

const idOf = (value) => {
  if (!value) return null
  const raw = value._id ? value._id : value
  return typeof raw === 'string' ? raw : raw.toString()
}

export const teacherEssayVisibilityFilter = async (user) => {
  if (!user || user.role !== 'teacher') return null
  const classes = await Class.find({ teacher: user._id, status: 'active' })
    .select('_id students')
    .lean()
  const studentIds = [...new Set(classes.flatMap((cls) => (cls.students || []).map(idOf)))]
  const classClauses = classes
    .filter((cls) => cls.students?.length)
    .map((cls) => ({ class: cls._id, student: { $in: cls.students } }))

  if (!studentIds.length) return { _id: { $in: [] } }

  const memberships = await Class.find({
    students: { $in: studentIds },
    status: 'active',
  }).select('teacher students').lean()
  const membershipCount = new Map()
  const membershipOwner = new Map()
  for (const cls of memberships) {
    for (const student of cls.students || []) {
      const key = idOf(student)
      membershipCount.set(key, (membershipCount.get(key) || 0) + 1)
      membershipOwner.set(key, idOf(cls.teacher))
    }
  }
  const unambiguousStudentIds = [...membershipCount]
    .filter(([student, count]) => count === 1 && membershipOwner.get(student) === idOf(user._id))
    .map(([student]) => student)
  if (unambiguousStudentIds.length) {
    classClauses.push({
      student: { $in: unambiguousStudentIds },
      $or: [{ class: null }, { class: { $exists: false } }],
    })
  }

  if (!classClauses.length) return { _id: { $in: [] } }
  return classClauses.length === 1 ? classClauses[0] : { $or: classClauses }
}

export const canTeacherAccessStudentProfile = async (user, studentId) => {
  if (!user || user.role !== 'teacher' || !studentId) return false
  const activeClasses = await Class.find({ students: studentId, status: 'active' })
    .select('teacher')
    .lean()
  return activeClasses.length === 1
    && idOf(activeClasses[0].teacher) === idOf(user._id)
}

/**
 * LG-05 / LG-06 / LG-07 / LG-08 / LG-09
 * Centralised object-level authorization (BOLA/IDOR) for essay access.
 *
 * Rules:
 *  - admin   : always true
 *  - student : only their own essay
 *  - teacher : only if the essay belongs to one of their active classes;
 *              unassigned legacy essays require an unambiguous active class
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
    case 'teacher': {
      const classFilter = {
          teacher: user._id,
          students: studentId,
          status: 'active',
      }
      if (essay.class) {
        return Boolean(await Class.exists({ ...classFilter, _id: idOf(essay.class) }))
      }
      try {
        return await canTeacherAccessStudentProfile(user, studentId)
      } catch {
        // Legacy essays have no class ownership to disambiguate. If the
        // membership lookup fails, deny access rather than falling back to
        // any active class shared with this student.
        return false
      }
    }
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
      return teacherEssayVisibilityFilter(user)
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
