const { Op } = require('sequelize');
const { sequelize, User, Charity, Donation, Project } = require('../models');
const notificationService = require('./notification.service');
const emailService = require('./email.service');

async function listCharities(filters, { limit, offset }) {
  const where = {};
  if (filters.status) where.status = filters.status;

  const { count, rows } = await Charity.findAndCountAll({
    where,
    distinct: true,
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'email'],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return { count, rows };
}

async function approveCharity(charityId) {
  const charity = await Charity.findByPk(charityId, {
    include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }],
  });

  if (!charity) {
    const err = new Error('Charity not found');
    err.statusCode = 404;
    throw err;
  }
  if (charity.status === 'approved') {
    const err = new Error('Charity is already approved');
    err.statusCode = 400;
    throw err;
  }

  await charity.update({ status: 'approved', adminNote: null });

  // In-app notification for the charity owner
  await notificationService.create(
    charity.userId,
    'charity_approved',
    `Your charity "${charity.name}" has been approved! You can now receive donations.`
  );

  // Email notification — fire-and-forget so admin action isn't blocked by email failure
  if (charity.owner) {
    emailService.sendCharityApproved(charity.owner, charity).catch((err) =>
      console.error('[email] sendCharityApproved failed:', err.message)
    );
  }

  // Re-fetch with fresh status
  return Charity.findByPk(charityId, {
    include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }],
  });
}

async function rejectCharity(charityId, adminNote) {
  const charity = await Charity.findByPk(charityId, {
    include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }],
  });

  if (!charity) {
    const err = new Error('Charity not found');
    err.statusCode = 404;
    throw err;
  }

  await charity.update({ status: 'rejected', adminNote });

  await notificationService.create(
    charity.userId,
    'charity_rejected',
    `Your charity "${charity.name}" was not approved. Reason: ${adminNote}`
  );

  if (charity.owner) {
    emailService.sendCharityRejected(charity.owner, charity, adminNote).catch((err) =>
      console.error('[email] sendCharityRejected failed:', err.message)
    );
  }

  return Charity.findByPk(charityId);
}

async function listUsers(filters, { limit, offset }) {
  const where = {};

  if (filters.search) {
    where[Op.or] = [
      { name:  { [Op.like]: `%${filters.search}%` } },
      { email: { [Op.like]: `%${filters.search}%` } },
    ];
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return { count, rows };
}

async function deactivateUser(userId) {
  const user = await User.findByPk(userId);

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  if (user.role === 'admin') {
    const err = new Error('Admin accounts cannot be deactivated this way');
    err.statusCode = 400;
    throw err;
  }

  // Soft-delete: mark inactive and revoke any active session immediately
  await user.update({ isActive: false, refreshTokenHash: null });
}

async function listDonations(filters, { limit, offset }) {
  const where = {};
  if (filters.status)    where.status    = filters.status;
  if (filters.charityId) where.charityId = filters.charityId;
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt[Op.gte] = new Date(filters.from);
    if (filters.to)   where.createdAt[Op.lte] = new Date(filters.to + 'T23:59:59');
  }

  const [{ count, rows }, sumResult] = await Promise.all([
    Donation.findAndCountAll({
      where,
      distinct: true,
      include: [
        { model: Charity, as: 'charity', attributes: ['id', 'name'] },
        { model: User,    as: 'donor',   attributes: ['id', 'name', 'email'] },
        { model: Project, as: 'project', attributes: ['id', 'title'], required: false },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    }),
    Donation.findOne({
      where,
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total']],
      raw: true,
    }),
  ]);

  return { count, rows, totalAmount: parseFloat(sumResult?.total || 0) };
}

module.exports = { listCharities, approveCharity, rejectCharity, listUsers, deactivateUser, listDonations };
