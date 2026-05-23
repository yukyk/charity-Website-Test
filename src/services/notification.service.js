const { Notification } = require('../models');

async function create(userId, type, message) {
  return Notification.create({ userId, type, message });
}

async function listNotifications(userId, { limit, offset }) {
  return Notification.findAndCountAll({
    where:   { userId },
    order:   [['createdAt', 'DESC']],
    limit,
    offset,
  });
}

async function getUnreadCount(userId) {
  return Notification.count({ where: { userId, isRead: false } });
}

async function markRead(userId, notificationId) {
  const notification = await Notification.findOne({
    where: { id: notificationId, userId },
  });
  if (!notification) {
    const err = new Error('Notification not found');
    err.statusCode = 404;
    throw err;
  }
  await notification.update({ isRead: true });
}

async function markAllRead(userId) {
  await Notification.update({ isRead: true }, { where: { userId, isRead: false } });
}

module.exports = { create, listNotifications, getUnreadCount, markRead, markAllRead };
