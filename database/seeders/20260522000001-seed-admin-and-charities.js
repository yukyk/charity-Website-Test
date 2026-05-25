'use strict';

const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

/**
 * Seed data: 1 admin + 3 charity-admin users + 3 approved charities.
 *
 * Credentials for development:
 *   admin@givehope.com   /  GiveHope@Admin2025
 *   sarah@givehope.com   /  Password@123
 *   michael@givehope.com /  Password@123
 *   priya@givehope.com   /  Password@123
 */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // ── Pre-hash passwords (bcrypt salt rounds = 10) ─────────────────────────
    const [adminHash, userHash] = await Promise.all([
      bcrypt.hash('GiveHope@Admin2025', 10),
      bcrypt.hash('Password@123', 10),
    ]);

    // ── Stable UUIDs so down() can target them precisely ─────────────────────
    const ids = {
      admin:    randomUUID(),
      sarah:    randomUUID(),
      michael:  randomUUID(),
      priya:    randomUUID(),
      charity1: randomUUID(),
      charity2: randomUUID(),
      charity3: randomUUID(),
    };

    // ── Users ─────────────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('Users', [
      {
        id:                     ids.admin,
        name:                   'Admin User',
        email:                  'admin@givehope.com',
        password:               adminHash,
        role:                   'admin',
        isVerified:             true,
        phone:                  null,
        address:                null,
        emailVerificationToken: null,
        resetPasswordToken:     null,
        resetPasswordExpiry:    null,
        createdAt:              now,
        updatedAt:              now,
      },
      {
        id:                     ids.sarah,
        name:                   'Sarah Johnson',
        email:                  'sarah@givehope.com',
        password:               userHash,
        role:                   'user',
        isVerified:             true,
        phone:                  '+1-555-0101',
        address:                'New York, USA',
        emailVerificationToken: null,
        resetPasswordToken:     null,
        resetPasswordExpiry:    null,
        createdAt:              now,
        updatedAt:              now,
      },
      {
        id:                     ids.michael,
        name:                   'Michael Chen',
        email:                  'michael@givehope.com',
        password:               userHash,
        role:                   'user',
        isVerified:             true,
        phone:                  '+65-8123-4567',
        address:                'Singapore',
        emailVerificationToken: null,
        resetPasswordToken:     null,
        resetPasswordExpiry:    null,
        createdAt:              now,
        updatedAt:              now,
      },
      {
        id:                     ids.priya,
        name:                   'Priya Sharma',
        email:                  'priya@givehope.com',
        password:               userHash,
        role:                   'user',
        isVerified:             true,
        phone:                  '+91-98765-43210',
        address:                'Mumbai, India',
        emailVerificationToken: null,
        resetPasswordToken:     null,
        resetPasswordExpiry:    null,
        createdAt:              now,
        updatedAt:              now,
      },
    ]);

    // ── Charities ─────────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('Charities', [
      {
        id:                 ids.charity1,
        name:               'Education For All',
        email:              'contact@educationforall.org',
        description:
          'We believe every child deserves access to quality education regardless of their background. ' +
          'Since 2010, we have built 47 schools across underserved communities and provided scholarships ' +
          'to over 12,000 students worldwide.',
        mission:
          'To eliminate educational inequality by building schools, training teachers, and providing ' +
          'scholarships to children in underprivileged communities across the globe.',
        logoUrl:            null,
        websiteUrl:         'https://educationforall.org',
        category:           'education',
        location:           'New York, USA',
        registrationNumber: 'EFA-2010-NY-00123',
        status:             'approved',
        adminNote:          null,
        goalAmount:         500000.00,
        raisedAmount:       123500.00,
        userId:             ids.sarah,
        createdAt:          now,
        updatedAt:          now,
      },
      {
        id:                 ids.charity2,
        name:               'Green Earth Initiative',
        email:              'hello@greenearth.org',
        description:
          'Green Earth Initiative leads reforestation and clean-energy projects across Southeast Asia. ' +
          'We have planted over 2 million trees and installed solar panels in 340 rural villages, ' +
          'reducing carbon emissions by an estimated 180,000 tonnes annually.',
        mission:
          'To combat climate change through large-scale reforestation, renewable energy adoption, ' +
          'and environmental education in the Asia-Pacific region.',
        logoUrl:            null,
        websiteUrl:         'https://greenearth.org',
        category:           'environment',
        location:           'Singapore',
        registrationNumber: 'GEI-SG-2015-7842',
        status:             'approved',
        adminNote:          null,
        goalAmount:         750000.00,
        raisedAmount:       312800.00,
        userId:             ids.michael,
        createdAt:          now,
        updatedAt:          now,
      },
      {
        id:                 ids.charity3,
        name:               'Hope Health Foundation',
        email:              'info@hopehealth.org',
        description:
          'Hope Health Foundation provides free medical care, mental health support, and nutrition ' +
          'programmes to low-income families across India. Our mobile clinics served over 85,000 ' +
          'patients last year in rural areas with no access to hospitals.',
        mission:
          'To ensure no one is denied healthcare due to poverty by deploying mobile medical units, ' +
          'funding community health workers, and running maternal and child health initiatives.',
        logoUrl:            null,
        websiteUrl:         'https://hopehealth.org',
        category:           'health',
        location:           'Mumbai, India',
        registrationNumber: 'HHF-MH-2012-00456',
        status:             'approved',
        adminNote:          null,
        goalAmount:         1000000.00,
        raisedAmount:       489200.00,
        userId:             ids.priya,
        createdAt:          now,
        updatedAt:          now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;

    // Delete in FK-safe order: charities before users
    await queryInterface.bulkDelete(
      'Charities',
      { email: { [Op.in]: ['contact@educationforall.org', 'hello@greenearth.org', 'info@hopehealth.org'] } },
      {}
    );

    await queryInterface.bulkDelete(
      'Users',
      { email: { [Op.in]: ['admin@givehope.com', 'sarah@givehope.com', 'michael@givehope.com', 'priya@givehope.com'] } },
      {}
    );
  },
};
