const { Op } = require('sequelize');
const { Charity, Project, ImpactReport, Donation, User } = require('../models');
const { stripHtml } = require('../utils/helpers');
const notificationService = require('./notification.service');
const emailService = require('./email.service');

// ── Internal helper ───────────────────────────────────────────────────────────

function assertOwnership(charity, userId) {
  if (!charity) {
    const err = new Error('Charity not found');
    err.statusCode = 404;
    throw err;
  }
  if (charity.userId !== userId) {
    const err = new Error('You do not have permission to manage this charity');
    err.statusCode = 403;
    throw err;
  }
}

// ── Public queries ─────────────────────────────────────────────────────────────

async function listCharities(filters, { limit, offset }) {
  const where = { status: 'approved' };

  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.location) {
    where.location = { [Op.like]: `%${filters.location}%` };
  }
  if (filters.search) {
    where[Op.or] = [
      { name:        { [Op.like]: `%${filters.search}%` } },
      { description: { [Op.like]: `%${filters.search}%` } },
    ];
  }

  const { count, rows } = await Charity.findAndCountAll({
    where,
    attributes: { exclude: ['adminNote'] },
    order: [['raisedAmount', 'DESC']],
    limit,
    offset,
  });

  return { count, rows };
}

async function getCharity(charityId) {
  const charity = await Charity.findOne({
    where: { id: charityId, status: 'approved' },
    attributes: { exclude: ['adminNote'] },
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'name'],
      },
      {
        model: Project,
        as: 'projects',
        where: { status: 'active' },
        required: false,
        separate: true, // prevents JOIN-based row explosion; supports order + where
        order: [['createdAt', 'DESC']],
      },
      {
        model: ImpactReport,
        as: 'impactReports',
        required: false,
        separate: true,
        order: [['createdAt', 'DESC']],
        limit: 3,
      },
    ],
  });

  if (!charity) {
    const err = new Error('Charity not found');
    err.statusCode = 404;
    throw err;
  }

  return charity;
}

// ── Charity admin mutations ────────────────────────────────────────────────────

async function createCharity(userId, data) {
  const {
    name, email, description, mission, category,
    location, registrationNumber, goalAmount, websiteUrl, logoUrl,
  } = data;

  const existing = await Charity.findOne({ where: { email } });
  if (existing) {
    const err = new Error('A charity with this email already exists');
    err.statusCode = 409;
    throw err;
  }

  const charity = await Charity.create({
    name:               stripHtml(name),
    email,
    description:        description ? stripHtml(description) : null,
    mission:            mission     ? stripHtml(mission)     : null,
    category,
    location:           location           || null,
    registrationNumber: registrationNumber || null,
    goalAmount:         goalAmount ? parseFloat(goalAmount) : null,
    websiteUrl:         websiteUrl || null,
    logoUrl:            logoUrl    || null,
    status:             'pending',
    raisedAmount:       0,
    userId,
  });

  return charity;
}

async function updateCharity(charityId, userId, data) {
  const charity = await Charity.findByPk(charityId);
  assertOwnership(charity, userId);

  const UPDATABLE = ['name', 'description', 'mission', 'category', 'location', 'websiteUrl', 'logoUrl', 'goalAmount'];
  const updates = {};

  for (const key of UPDATABLE) {
    if (data[key] === undefined) continue;
    if (['name', 'description', 'mission'].includes(key)) {
      updates[key] = stripHtml(data[key]);
    } else if (key === 'goalAmount') {
      updates[key] = data[key] ? parseFloat(data[key]) : null;
    } else {
      updates[key] = data[key];
    }
  }

  await charity.update(updates);
  return Charity.findByPk(charityId);
}

async function addProject(charityId, userId, data) {
  const charity = await Charity.findByPk(charityId);
  assertOwnership(charity, userId);

  const { title, description, targetAmount, imageUrl } = data;

  return Project.create({
    title:        stripHtml(title),
    description:  description ? stripHtml(description) : null,
    targetAmount: parseFloat(targetAmount),
    raisedAmount: 0,
    imageUrl:     imageUrl || null,
    status:       'active',
    charityId,
  });
}

async function updateProject(charityId, projectId, userId, data) {
  const charity = await Charity.findByPk(charityId);
  assertOwnership(charity, userId);

  const project = await Project.findOne({ where: { id: projectId, charityId } });
  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }

  const UPDATABLE = ['title', 'description', 'targetAmount', 'status', 'imageUrl'];
  const updates = {};

  for (const key of UPDATABLE) {
    if (data[key] === undefined) continue;
    if (['title', 'description'].includes(key)) {
      updates[key] = stripHtml(data[key]);
    } else if (key === 'targetAmount') {
      updates[key] = parseFloat(data[key]);
    } else {
      updates[key] = data[key];
    }
  }

  await project.update(updates);
  return Project.findByPk(projectId);
}

async function getCharityDonations(charityId, userId, { limit, offset }) {
  const charity = await Charity.findByPk(charityId);
  assertOwnership(charity, userId);

  const { count, rows } = await Donation.findAndCountAll({
    where: { charityId },
    distinct: true,
    include: [
      {
        model: User,
        as: 'donor',
        attributes: ['id', 'name', 'email'],
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

  // Respect isAnonymous — mask donor identity before returning
  const maskedRows = rows.map((d) => {
    const donation = d.toJSON();
    if (donation.isAnonymous) {
      donation.donor = { name: 'Anonymous Donor' };
    }
    return donation;
  });

  return { count, rows: maskedRows };
}

async function addImpactReport(charityId, userId, data) {
  const charity = await Charity.findByPk(charityId);
  assertOwnership(charity, userId);

  const { title, content, imageUrl } = data;

  const report = await ImpactReport.create({
    title:    stripHtml(title),
    content:  stripHtml(content),
    imageUrl: imageUrl || null,
    charityId,
  });

  // Notify all unique past donors with an in-app notification + email
  const donorRecords = await Donation.findAll({
    where:      { charityId, status: 'completed' },
    attributes: ['userId'],
    group:      ['userId'],
    raw:        true,
  });

  const donorIds = donorRecords.map((r) => r.userId);

  await Promise.allSettled(
    donorIds.map((donorId) =>
      notificationService.create(
        donorId,
        'impact_report',
        `${charity.name} shared a new impact report: "${report.title}"`
      )
    )
  );

  if (donorIds.length > 0) {
    User.findAll({
      where:      { id: donorIds },
      attributes: ['id', 'name', 'email'],
    }).then((donors) =>
      emailService.sendImpactReport(donors, charity, report)
    ).catch((err) => {
      console.error('[email] impact-report batch failed:', err.message);
    });
  }

  return report;
}

async function listImpactReports(charityId, { limit, offset }) {
  const { count, rows } = await ImpactReport.findAndCountAll({
    where: { charityId },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return { count, rows };
}

module.exports = {
  listCharities,
  getCharity,
  createCharity,
  updateCharity,
  addProject,
  updateProject,
  getCharityDonations,
  addImpactReport,
  listImpactReports,
};
