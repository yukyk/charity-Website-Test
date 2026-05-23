'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Donations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(10),
        defaultValue: 'INR',
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded'),
        defaultValue: 'pending',
        allowNull: false,
      },
      paymentGateway: {
        type: Sequelize.ENUM('razorpay', 'stripe'),
        allowNull: false,
      },
      paymentId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      paymentOrderId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      receiptUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      isAnonymous: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      charityId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Charities', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      projectId: {
        type: Sequelize.UUID,
        allowNull: true, // nullable — donation may not be tied to a specific project
        references: { model: 'Projects', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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

    await queryInterface.addIndex('Donations', ['userId'], { name: 'donations_userId_idx' });
    await queryInterface.addIndex('Donations', ['charityId'], { name: 'donations_charityId_idx' });
    await queryInterface.addIndex('Donations', ['projectId'], { name: 'donations_projectId_idx' });
    await queryInterface.addIndex('Donations', ['status'], { name: 'donations_status_idx' });
    // Index for fast payment lookup (paymentId can be null before verification, so not unique)
    await queryInterface.addIndex('Donations', ['paymentId'], { name: 'donations_paymentId_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Donations');
  },
};
