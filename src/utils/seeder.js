/**
 * Mavro Admin — Database Seeder
 * Creates the initial superadmin user and the two live tenants
 * (Spanbix + SaiSatwik) via their idempotent upsert bootstraps.
 *
 * The legacy demo tenants (HRMS, Ticket Management, Fleet, Inventory,
 * Transport) were retired in July 2026 — only Spanbix and SaiSatwik are live.
 *
 * Usage: npm run seed
 */
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const mongoose = require('mongoose');
const { AdminUser } = require('../models');
const config = require('../config');
const { upsertSpanbixTenant } = require('./seedSpanbix');
const { upsertSaisatwikTenant } = require('./seedSaisatwik');

const seedAdmin = async () => {
  const existing = await AdminUser.findOne({ email: config.admin.email });
  if (existing) {
    console.log('ℹ️  Admin user already exists, skipping...');
    return existing;
  }

  const admin = await AdminUser.create({
    name: config.admin.name,
    email: config.admin.email,
    password: config.admin.password,
    role: 'superadmin',
    assignedWebsites: [], // superadmin has access to ALL
  });

  console.log(`✅ Super Admin created: ${admin.email}`);
  return admin;
};

const seed = async () => {
  try {
    await mongoose.connect(config.mongo.uri);
    console.log('📦 Connected to MongoDB for seeding...\n');

    await seedAdmin();
    await upsertSpanbixTenant();
    await upsertSaisatwikTenant();

    console.log('\n🎉 Seeding complete!');
    console.log('\n📋 Login credentials:');
    console.log(`   Super Admin: ${config.admin.email} / (ADMIN_PASSWORD from .env)`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seed();
