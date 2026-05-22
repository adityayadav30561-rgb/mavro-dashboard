const mongoose = require('mongoose');
const dns = require('dns');
const config = require('./index');

// Fix: Use Google DNS for SRV record resolution (some ISP DNS servers block MongoDB Atlas SRV lookups)
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

/**
 * Connect to MongoDB with production-ready settings
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongo.uri, config.mongo.options);

    console.log(`✅ MongoDB connected: ${conn.connection.host} [${conn.connection.name}]`);

    // Connection events
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Mongoose will auto-reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
