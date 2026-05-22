/**
 * PM2 Ecosystem Configuration
 *
 * Usage:
 *   Development: pm2 start ecosystem.config.js --env development
 *   Production:  pm2 start ecosystem.config.js --env production
 *   Monitor:     pm2 monit
 *   Logs:        pm2 logs mavro-api
 *   Restart:     pm2 restart mavro-api
 */
module.exports = {
  apps: [
    {
      name: 'mavro-api',
      script: 'src/server.js',
      instances: 'max', // Use all CPU cores (cluster mode)
      exec_mode: 'cluster',

      // Environment
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // Auto-restart
      watch: false, // Disable in production; use nodemon for dev
      max_memory_restart: '500M', // Restart if memory exceeds 500MB
      max_restarts: 10, // Max restarts before stopping
      min_uptime: '10s', // Min uptime to consider "started"

      // Logs
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,

      // Graceful shutdown
      kill_timeout: 30000, // 30s to finish requests before force kill
      listen_timeout: 10000, // 10s to bind port on startup
      shutdown_with_message: true,

      // Auto-restart on crashes
      autorestart: true,
      exp_backoff_restart_delay: 100, // Exponential backoff on repeated crashes
    },
  ],
};
