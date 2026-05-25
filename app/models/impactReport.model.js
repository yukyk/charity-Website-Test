const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const ImpactReport = sequelize.define(
  'ImpactReport',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    charityId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: 'ImpactReports',
  }
);

module.exports = ImpactReport;
