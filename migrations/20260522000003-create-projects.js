'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Projects', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      targetAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      raisedAmount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
      },
      imageUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('active', 'completed', 'paused'),
        defaultValue: 'active',
        allowNull: false,
      },
      charityId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Charities', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('Projects', ['charityId'], { name: 'projects_charityId_idx' });
    await queryInterface.addIndex('Projects', ['status'], { name: 'projects_status_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Projects');
  },
};
