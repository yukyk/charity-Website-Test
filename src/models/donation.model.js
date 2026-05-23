const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Donation = sequelize.define(
  'Donation',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(10),
      defaultValue: 'INR',
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      defaultValue: 'pending',
    },
    paymentGateway: {
      type: DataTypes.ENUM('razorpay', 'stripe'),
      allowNull: false,
    },
    paymentId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymentOrderId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    receiptUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    charityId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: true, // optional — donation may not be tied to a project
    },
  },
  {
    tableName: 'Donations',
  }
);

module.exports = Donation;
