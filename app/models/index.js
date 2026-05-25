const { sequelize } = require('../../config/database');

const User         = require('./user.model');
const Charity      = require('./charity.model');
const Project      = require('./project.model');
const Donation     = require('./donation.model');
const ImpactReport = require('./impactReport.model');
const Notification = require('./notification.model');

// ── Associations ──────────────────────────────────────────────────────────────

// User ↔ Charity (a user can be admin-owner of many charities)
User.hasMany(Charity, { foreignKey: 'userId', as: 'charities' });
Charity.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

// Charity ↔ Project
Charity.hasMany(Project, { foreignKey: 'charityId', as: 'projects' });
Project.belongsTo(Charity, { foreignKey: 'charityId', as: 'charity' });

// Charity ↔ ImpactReport
Charity.hasMany(ImpactReport, { foreignKey: 'charityId', as: 'impactReports' });
ImpactReport.belongsTo(Charity, { foreignKey: 'charityId', as: 'charity' });

// User ↔ Donation
User.hasMany(Donation, { foreignKey: 'userId', as: 'donations' });
Donation.belongsTo(User, { foreignKey: 'userId', as: 'donor' });

// Charity ↔ Donation
Charity.hasMany(Donation, { foreignKey: 'charityId', as: 'donations' });
Donation.belongsTo(Charity, { foreignKey: 'charityId', as: 'charity' });

// Project ↔ Donation (optional)
Project.hasMany(Donation, { foreignKey: 'projectId', as: 'donations' });
Donation.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// User ↔ Notification
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Charity,
  Project,
  Donation,
  ImpactReport,
  Notification,
};
