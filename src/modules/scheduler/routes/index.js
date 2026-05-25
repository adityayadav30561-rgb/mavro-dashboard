const express = require('express');

const eventTypeRoutes = require('./eventTypeRoutes');
const bookingRoutes = require('./bookingRoutes');
const calendarConnectionRoutes = require('./calendarConnectionRoutes');
const workflowRoutes = require('./workflowRoutes');
const workflowOpsRoutes = require('./workflowOpsRoutes');
const routingFormRoutes = require('./routingFormRoutes');
const publicBookingRoutes = require('./publicBookingRoutes');

// ===================================
// Aggregated scheduler router
// ===================================

const schedulerRoutes = express.Router();
schedulerRoutes.use('/event-types', eventTypeRoutes);
schedulerRoutes.use('/bookings', bookingRoutes);
schedulerRoutes.use('/calendar-connections', calendarConnectionRoutes);
schedulerRoutes.use('/workflows', workflowRoutes);
schedulerRoutes.use('/routing-forms', routingFormRoutes);
// Ops routes (executions, webhook deliveries, replay) mount at /ops/* so
// they don't collide with /bookings/:id (workflowOps owns /bookings/:id/retry-provider).
schedulerRoutes.use('/ops', workflowOpsRoutes);

module.exports = {
  schedulerRoutes,
  schedulerPublicRoutes: publicBookingRoutes,
};
