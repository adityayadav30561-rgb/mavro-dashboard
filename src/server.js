/**
 * Mavro Admin Backend — Server Entry Point
 *
 * Production: Use PM2 for process management, auto-restart, and clustering.
 * Development: Use nodemon for auto-reload.
 */
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const config = require('./config');
const { scheduledPublishService } = require('./services');
const { upsertSpanbixTenant } = require('./utils/seedSpanbix');
const { upsertSaisatwikTenant } = require('./utils/seedSaisatwik');

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Auto-bootstrap the live tenants (Spanbix + SaiSatwik). Each Website row
  // carries branding + aiContext + seoDefaults so the admin /websites page
  // lists them the moment the backend boots. Idempotent — refreshes content
  // fields every boot but preserves any branding admins customise in the UI.
  // Errors are swallowed silently so a misconfigured seed never blocks boot.
  await upsertSpanbixTenant({ silent: true });
  await upsertSaisatwikTenant({ silent: true });

  // Start the scheduled-publish worker (polls every 60s for due blogs)
  scheduledPublishService.start();

  // Start Express server
  const server = app.listen(config.port, () => {
    console.log(`\n🚀 Mavro Admin API`);
    console.log(`   Mode:   ${config.env}`);
    console.log(`   Port:   ${config.port}`);
    console.log(`   API:    http://localhost:${config.port}/api`);
    console.log(`   Health: http://localhost:${config.port}/api/health`);
    if (config.env === 'production') {
      console.log(`   Admin:  http://localhost:${config.port}`);
    }
    console.log('');
  });

  // Graceful shutdown (important for PM2, Docker, Kubernetes)
  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    // Stop background workers before mongo close
    try { scheduledPublishService.stop(); } catch { /* noop */ }

    // Stop accepting new connections
    server.close(async () => {
      try {
        // Close MongoDB connection
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
      } catch (err) {
        console.error('❌ Error closing MongoDB:', err.message);
      }
      console.log('✅ Server closed');
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      console.error('❌ Forced shutdown after 30s timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle unhandled rejections
  process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err.message);
    if (config.env === 'production') {
      // In production, log but don't crash — PM2 will restart
      console.error(err.stack);
    } else {
      server.close(() => process.exit(1));
    }
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message);
    console.error(err.stack);
    // Always crash on uncaught exceptions — PM2 will restart
    process.exit(1);
  });
};

startServer();
