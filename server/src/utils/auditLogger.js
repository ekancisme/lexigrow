import AuditLog from '../models/AuditLog.js'

/**
 * Log an administrative or important system action.
 * @param {string} userId - ID of user who performed the action
 * @param {string} action - Action identifier (e.g. 'CREATE_CLASS')
 * @param {string} targetType - Model/entity type affected (e.g. 'Class')
 * @param {string} targetId - ID of entity affected
 * @param {object} details - Additional metadata or payload
 */
export const logAction = async (userId, action, targetType, targetId, details = {}) => {
  try {
    if (!userId) {
      console.warn(`[AuditLog] Blocked logging action '${action}' due to missing userId.`)
      return
    }
    await AuditLog.create({
      user: userId,
      action,
      targetType,
      targetId: targetId ? targetId.toString() : null,
      details
    })
  } catch (err) {
    console.error('[AuditLog] Failed to create audit log:', err.message)
  }
}
