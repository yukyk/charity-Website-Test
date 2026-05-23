const adminService = require('../services/admin.service');
const { successResponse, paginatedResponse } = require('../utils/response');
const { parsePagination } = require('../utils/helpers');

async function listCharities(req, res, next) {
  try {
    const pagination = parsePagination(req.query);
    const { status } = req.query;
    const result = await adminService.listCharities({ status }, pagination);
    res.json(paginatedResponse(result.rows, { total: result.count, ...pagination }, 'Charities fetched.'));
  } catch (err) {
    next(err);
  }
}

async function approveCharity(req, res, next) {
  try {
    const charity = await adminService.approveCharity(req.params.id);
    res.json(successResponse(charity, 'Charity approved.'));
  } catch (err) {
    next(err);
  }
}

async function rejectCharity(req, res, next) {
  try {
    const charity = await adminService.rejectCharity(req.params.id, req.body.adminNote);
    res.json(successResponse(charity, 'Charity rejected.'));
  } catch (err) {
    next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const pagination = parsePagination(req.query);
    const { search } = req.query;
    const result = await adminService.listUsers({ search }, pagination);
    res.json(paginatedResponse(result.rows, { total: result.count, ...pagination }, 'Users fetched.'));
  } catch (err) {
    next(err);
  }
}

async function deactivateUser(req, res, next) {
  try {
    await adminService.deactivateUser(req.params.id);
    res.json(successResponse(null, 'User deactivated.'));
  } catch (err) {
    next(err);
  }
}

module.exports = { listCharities, approveCharity, rejectCharity, listUsers, deactivateUser };
