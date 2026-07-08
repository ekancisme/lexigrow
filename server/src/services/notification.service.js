import Notification from '../models/Notification.js'
import { sendNotificationToUser } from './socket.service.js'

/**
 * Create a single notification and dispatch it in real time
 * @param {Object} data - Notification fields (recipient, sender, title, message, type, link)
 * @returns {Promise<Object>} The created and populated notification document
 */
export const createNotification = async (data) => {
  const notification = await Notification.create(data)
  
  // Populate details before emitting so client gets full information
  const populated = await Notification.findById(notification._id)
    .populate('sender', 'name role')
    .populate('alert', 'type metric detail')

  // Send via WebSocket to the recipient's room
  sendNotificationToUser(notification.recipient.toString(), populated)
  
  return populated
}

/**
 * Create multiple notifications (e.g., for parents) and dispatch them in real time
 * @param {Array<Object>} notificationsArray - Array of notification data objects
 * @returns {Promise<Array<Object>>} The created notification documents
 */
export const createManyNotifications = async (notificationsArray) => {
  const created = await Notification.insertMany(notificationsArray)
  
  const populatedNotifications = []
  for (const item of created) {
    const populated = await Notification.findById(item._id)
      .populate('sender', 'name role')
      .populate('alert', 'type metric detail')
      
    sendNotificationToUser(item.recipient.toString(), populated)
    populatedNotifications.push(populated)
  }
  
  return populatedNotifications
}
