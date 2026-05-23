const notificationService = require('../services/notification.service');
const { successResponse, paginatedResponse } = require('../utils/response');
const { parsePagination } = require('../utils/helpers');

async function listNotifications(req, res, next) {
  try {
    const pagination = parsePagination(req.query);
    const result = await notificationService.listNotifications(req.user.id, pagination);
    res.json(paginatedResponse(result.rows, { total: result.count, ...pagination }, 'Notifications fetched.'));
  } catch (err) {
    next(err);
  }
}

async function getUnreadCount(req, res, next) {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json(successResponse({ count }, 'Unread count fetched.'));
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    await notificationService.markRead(req.user.id, req.params.id);
    res.json(successResponse(null, 'Notification marked as read.'));
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await notificationService.markAllRead(req.user.id);
    res.json(successResponse(null, 'All notifications marked as read.'));
  } catch (err) {
    next(err);
  }
}

module.exports = { listNotifications, getUnreadCount, markRead, markAllRead };
