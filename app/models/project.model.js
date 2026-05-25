const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Project = sequelize.define(
  'Project',
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    targetAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    raisedAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'paused'),
      defaultValue: 'active',
    },
    charityId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: 'Projects',
  }
);

module.exports = Project;
