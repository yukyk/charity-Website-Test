'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM(
          'donation_confirmed',
          'charity_approved',
          'charity_rejected',
          'impact_report',
          'reminder'
        ),
        allowNull: false,
      },
      message: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
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

    await queryInterface.addIndex('Notifications', ['userId'], { name: 'notifications_userId_idx' });
    await queryInterface.addIndex('Notifications', ['isRead'], { name: 'notifications_isRead_idx' });
    // Composite index — fetch unread notifications for a user in one scan
    await queryInterface.addIndex('Notifications', ['userId', 'isRead'], {
      name: 'notifications_userId_isRead_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Notifications');
  },
};
