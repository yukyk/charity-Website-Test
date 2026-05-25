'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'isActive', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      after: 'refreshTokenHash',
    });

    await queryInterface.addIndex('Users', ['isActive'], { name: 'users_isActive_idx' });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('Users', 'users_isActive_idx');
    await queryInterface.removeColumn('Users', 'isActive');
  },
};
