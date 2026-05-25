const charityService = require('../services/charity.service');
const { successResponse, paginatedResponse } = require('../../utils/response');
const { parsePagination } = require('../../utils/helpers');

class CharityController {
  async listCharities(req, res, next) {
    try {
      const pagination = parsePagination(req.query);
      const { category, search, location } = req.query;
      const result = await charityService.listCharities({ category, search, location }, pagination);
      res.json(paginatedResponse(result.rows, { total: result.count, ...pagination }, 'Charities fetched.'));
    } catch (err) {
      next(err);
    }
  }

  async getCharity(req, res, next) {
    try {
      const charity = await charityService.getCharity(req.params.id);
      res.json(successResponse(charity));
    } catch (err) {
      next(err);
    }
  }

  async getMyCharity(req, res, next) {
    try {
      const charity = await charityService.getMyCharity(req.user.id);
      res.json(successResponse(charity));
    } catch (err) {
      next(err);
    }
  }

  async createCharity(req, res, next) {
    try {
      const charity = await charityService.createCharity(req.user.id, req.body);
      res.status(201).json(successResponse(charity, 'Charity registered. Awaiting admin approval.'));
    } catch (err) {
      next(err);
    }
  }

  async updateCharity(req, res, next) {
    try {
      const charity = await charityService.updateCharity(req.params.id, req.user.id, req.body);
      res.json(successResponse(charity, 'Charity updated.'));
    } catch (err) {
      next(err);
    }
  }

  async addProject(req, res, next) {
    try {
      const project = await charityService.addProject(req.params.id, req.user.id, req.body);
      res.status(201).json(successResponse(project, 'Project added.'));
    } catch (err) {
      next(err);
    }
  }

  async updateProject(req, res, next) {
    try {
      const project = await charityService.updateProject(req.params.id, req.params.pid, req.user.id, req.body);
      res.json(successResponse(project, 'Project updated.'));
    } catch (err) {
      next(err);
    }
  }

  async getCharityDonations(req, res, next) {
    try {
      const pagination = parsePagination(req.query);
      const result = await charityService.getCharityDonations(req.params.id, req.user.id, pagination);
      res.json(paginatedResponse(result.rows, { total: result.count, ...pagination }, 'Donations fetched.'));
    } catch (err) {
      next(err);
    }
  }

  async addImpactReport(req, res, next) {
    try {
      const report = await charityService.addImpactReport(req.params.id, req.user.id, req.body);
      res.status(201).json(successResponse(report, 'Impact report posted.'));
    } catch (err) {
      next(err);
    }
  }

  async listImpactReports(req, res, next) {
    try {
      const pagination = parsePagination(req.query);
      const result = await charityService.listImpactReports(req.params.id, pagination);
      res.json(paginatedResponse(result.rows, { total: result.count, ...pagination }, 'Impact reports fetched.'));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CharityController();
