'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'refreshTokenHash', {
      type: Sequelize.STRING(64), // SHA-256 hex digest is always 64 chars
      allowNull: true,
      defaultValue: null,
      after: 'resetPasswordExpiry',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Users', 'refreshTokenHash');
  },
};
