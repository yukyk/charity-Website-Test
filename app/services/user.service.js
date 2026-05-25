const bcrypt = require('bcryptjs');
const { User, Donation, Charity, Project } = require('../models');
const { stripHtml } = require('../../utils/helpers');

const SALT_ROUNDS = 12;

async function getProfile(userId) {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return user;
}

async function updateProfile(userId, data) {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const updates = {};
  if (data.name     !== undefined) updates.name    = stripHtml(data.name);
  if (data.phone    !== undefined) updates.phone   = data.phone;
  if (data.address  !== undefined) updates.address = data.address;

  await user.update(updates);
  // Re-fetch through defaultScope so response is consistent
  return User.findByPk(userId);
}

async function changePassword(userId, currentPassword, newPassword) {
  // Unscoped to get the hashed password column — Error #3 pattern
  const user = await User.unscoped().findByPk(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) {
    const err = new Error('Current password is incorrect');
    err.statusCode = 400;
    throw err;
  }

  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  // Invalidate active sessions so the user must log in again with the new password
  await user.update({ password: hashed, refreshTokenHash: null });
}

async function getDonations(userId, { limit, offset }) {
  const { count, rows } = await Donation.findAndCountAll({
    where: { userId },
    distinct: true, // prevents inflated count when JOINing belongsTo associations
    include: [
      {
        model: Charity,
        as: 'charity',
        attributes: ['id', 'name', 'logoUrl', 'category'],
      },
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'title'],
        required: false,
      },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return { count, rows };
}

async function getDonationReceipt(userId, donationId) {
  const donation = await Donation.findOne({
    where: { id: donationId, userId },
    include: [
      {
        model: Charity,
        as: 'charity',
        attributes: ['id', 'name', 'email', 'logoUrl', 'location', 'category'],
      },
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'title'],
        required: false,
      },
    ],
  });

  if (!donation) {
    const err = new Error('Donation not found or access denied');
    err.statusCode = 404;
    throw err;
  }

  return donation;
}

module.exports = { getProfile, updateProfile, changePassword, getDonations, getDonationReceipt };
