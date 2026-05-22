/**
 * Mavro Admin — Database Seeder
 * Creates initial admin user, sample websites, and demo team members
 *
 * Usage: npm run seed
 */
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const mongoose = require('mongoose');
const { AdminUser, Website } = require('../models');
const config = require('../config');

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

const seedWebsites = async () => {
  const count = await Website.countDocuments();
  if (count > 0) {
    console.log(`ℹ️  ${count} websites already exist, skipping...`);
    return Website.find();
  }

  const websites = [
    {
      name: 'Mavro HRMS',
      domain: 'hrms.mavro.com',
      description: 'Human Resource Management System by Mavro',
      status: 'active',
      branding: { primaryColor: '#7c3aed', secondaryColor: '#4f46e5' },
    },
    {
      name: 'Mavro Ticket Management',
      domain: 'tickets.mavro.com',
      description: 'Ticket Management System by Mavro',
      status: 'active',
      branding: { primaryColor: '#0891b2', secondaryColor: '#0e7490' },
    },
    {
      name: 'Spanbix',
      domain: 'localhost:5173/spanbix',
      description:
        "Spanbix is India's premier enterprise career learning platform — purpose-built to bridge the gap between commerce, management, and humanities graduates and the country's highest-paying SAP and enterprise technology roles.",
      status: 'active',
      branding: { primaryColor: '#102c56', secondaryColor: '#2764e4', fontFamily: 'Sora' },
    },
    {
      name: 'Mavro Fleet Management',
      domain: 'fleet.mavro.com',
      description: 'Fleet Management System by Mavro',
      status: 'active',
      branding: { primaryColor: '#059669', secondaryColor: '#047857' },
    },
    {
      name: 'Mavro Inventory Management',
      domain: 'inventory.mavro.com',
      description: 'Inventory Management System by Mavro',
      status: 'active',
      branding: { primaryColor: '#d97706', secondaryColor: '#b45309' },
    },
    {
      name: 'Mavro Transport Management',
      domain: 'transport.mavro.com',
      description: 'Transport Management System by Mavro',
      status: 'active',
      branding: { primaryColor: '#dc2626', secondaryColor: '#b91c1c' },
    },
  ];

  const created = await Website.insertMany(websites);
  console.log(`✅ ${created.length} websites created`);
  return created;
};

/**
 * Create demo team members with different roles and website assignments
 */
const seedDemoUsers = async (websites) => {
  const demoCount = await AdminUser.countDocuments({ role: { $ne: 'superadmin' } });
  if (demoCount > 0) {
    console.log(`ℹ️  ${demoCount} team members already exist, skipping...`);
    return;
  }

  if (!websites || websites.length < 3) {
    console.log('ℹ️  Not enough websites to create demo users, skipping...');
    return;
  }

  const demoUsers = [
    {
      name: 'HRMS Editor',
      email: 'editor.hrms@mavro.com',
      password: 'Editor@123456',
      role: 'editor',
      assignedWebsites: [websites[0]._id], // HRMS only
    },
    {
      name: 'Fleet Admin',
      email: 'admin.fleet@mavro.com',
      password: 'Admin@123456',
      role: 'admin',
      assignedWebsites: [websites[2]._id, websites[4]._id], // Fleet + Transport
    },
    {
      name: 'SEO Manager',
      email: 'seo@mavro.com',
      password: 'Seo@123456',
      role: 'seo_manager',
      assignedWebsites: websites.map((w) => w._id), // All websites
    },
  ];

  await AdminUser.insertMany(demoUsers);
  console.log(`✅ ${demoUsers.length} demo team members created`);
};

const seed = async () => {
  try {
    await mongoose.connect(config.mongo.uri);
    console.log('📦 Connected to MongoDB for seeding...\n');

    await seedAdmin();
    const websites = await seedWebsites();
    await seedDemoUsers(websites);

    console.log('\n🎉 Seeding complete!');
    console.log('\n📋 Login credentials:');
    console.log('   Super Admin: admin@mavro.com / Admin@123456');
    console.log('   HRMS Editor: editor.hrms@mavro.com / Editor@123456');
    console.log('   Fleet Admin: admin.fleet@mavro.com / Admin@123456');
    console.log('   SEO Manager: seo@mavro.com / Seo@123456');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seed();
