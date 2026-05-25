'use strict';

/**
 * One-shot script: update admin@givehope.com password to GiveHope@Admin2025
 * Run: node scripts/update-admin-password.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    logging: false,
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    const hash = await bcrypt.hash('GiveHope@Admin2025', 10);
    const [rows] = await sequelize.query(
      `UPDATE Users SET password = ?, updatedAt = NOW() WHERE email = 'admin@givehope.com'`,
      { replacements: [hash] }
    );
    if (rows.affectedRows === 0) {
      console.log('No admin user found — have you run the seeder?');
    } else {
      console.log('Admin password updated successfully.');
      console.log('  Email:    admin@givehope.com');
      console.log('  Password: GiveHope@Admin2025');
    }
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
})();
