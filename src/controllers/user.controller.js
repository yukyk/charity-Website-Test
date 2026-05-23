const userService = require('../services/user.service');
const { successResponse, paginatedResponse } = require('../utils/response');
const { parsePagination } = require('../utils/helpers');

async function getProfile(req, res, next) {
  try {
    const user = await userService.getProfile(req.user.id);
    res.json(successResponse(user));
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const user = await userService.updateProfile(req.user.id, req.body);
    res.json(successResponse(user, 'Profile updated.'));
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    await userService.changePassword(req.user.id, currentPassword, newPassword);
    res.json(successResponse(null, 'Password changed successfully.'));
  } catch (err) {
    next(err);
  }
}

async function getDonations(req, res, next) {
  try {
    const pagination = parsePagination(req.query);
    const result = await userService.getDonations(req.user.id, pagination);
    res.json(paginatedResponse(result.rows, { total: result.count, ...pagination }, 'Donations fetched.'));
  } catch (err) {
    next(err);
  }
}

async function getDonationReceipt(req, res, next) {
  try {
    const receipt = await userService.getDonationReceipt(req.user.id, req.params.id);
    res.json(successResponse(receipt));
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, changePassword, getDonations, getDonationReceipt };
