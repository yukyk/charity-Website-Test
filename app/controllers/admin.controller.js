const adminService = require('../services/admin.service');
const { successResponse, paginatedResponse } = require('../../utils/response');
const { parsePagination } = require('../../utils/helpers');

class AdminController {
  async listCharities(req, res, next) {
    try {
      const pagination = parsePagination(req.query);
      const { status } = req.query;
      const result = await adminService.listCharities({ status }, pagination);
      res.json(paginatedResponse(result.rows, { total: result.count, ...pagination }, 'Charities fetched.'));
    } catch (err) {
      next(err);
    }
  }

  async approveCharity(req, res, next) {
    try {
      const charity = await adminService.approveCharity(req.params.id);
      res.json(successResponse(charity, 'Charity approved.'));
    } catch (err) {
      next(err);
    }
  }

  async rejectCharity(req, res, next) {
    try {
      const charity = await adminService.rejectCharity(req.params.id, req.body.adminNote);
      res.json(successResponse(charity, 'Charity rejected.'));
    } catch (err) {
      next(err);
    }
  }

  async listUsers(req, res, next) {
    try {
      const pagination = parsePagination(req.query);
      const { search } = req.query;
      const result = await adminService.listUsers({ search }, pagination);
      res.json(paginatedResponse(result.rows, { total: result.count, ...pagination }, 'Users fetched.'));
    } catch (err) {
      next(err);
    }
  }

  async deactivateUser(req, res, next) {
    try {
      await adminService.deactivateUser(req.params.id);
      res.json(successResponse(null, 'User deactivated.'));
    } catch (err) {
      next(err);
    }
  }

  async listDonations(req, res, next) {
    try {
      const pagination = parsePagination(req.query);
      const { status, charityId, from, to } = req.query;
      const result = await adminService.listDonations({ status, charityId, from, to }, pagination);
      const response = paginatedResponse(result.rows, { total: result.count, ...pagination }, 'Donations fetched.');
      response.totalAmount = result.totalAmount;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminController();
