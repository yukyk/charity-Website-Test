'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Charities', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      mission: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      logoUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      websiteUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      category: {
        type: Sequelize.ENUM('education', 'health', 'environment', 'poverty', 'disaster', 'animals', 'other'),
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      registrationNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
        allowNull: false,
      },
      adminNote: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      goalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      raisedAmount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
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

    await queryInterface.addIndex('Charities', ['email'], { unique: true, name: 'charities_email_unique' });
    await queryInterface.addIndex('Charities', ['status'], { name: 'charities_status_idx' });
    await queryInterface.addIndex('Charities', ['category'], { name: 'charities_category_idx' });
    await queryInterface.addIndex('Charities', ['userId'], { name: 'charities_userId_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Charities');
  },
};
