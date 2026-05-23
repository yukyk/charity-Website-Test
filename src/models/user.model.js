const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // Error #1 — always set defaultValue on UUID PKs
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
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user',
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetPasswordExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // SHA-256 hash of the active refresh token — cleared on logout/password-reset/deactivation
    refreshTokenHash: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
  },
  {
    tableName: 'Users',
    // Error #3 — all sensitive fields excluded from every query by default.
    // Use User.unscoped() inside auth.service.js ONLY when the raw field is needed.
    defaultScope: {
      attributes: {
        exclude: [
          'password',
          'emailVerificationToken',
          'resetPasswordToken',
          'resetPasswordExpiry',
          'refreshTokenHash',
        ],
      },
    },
  }
);

module.exports = User;
