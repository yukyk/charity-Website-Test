const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Charity = sequelize.define(
  'Charity',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    mission: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    logoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    websiteUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM('education', 'health', 'environment', 'poverty', 'disaster', 'animals', 'other'),
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    registrationNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    adminNote: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    goalAmount: {
      type: DataTypes.DECIMAL(10, 2), // Error #12 — always DECIMAL(10,2) for money
      allowNull: true,
    },
    raisedAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: 'Charities',
  }
);

module.exports = Charity;
