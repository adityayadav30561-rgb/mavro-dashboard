const express = require('express');
const router = express.Router();
const {
  listExecutions, listWebhookDeliveries,
  replayExecution, retryProvider, retryWebhookDelivery,
} = require('../controllers/workflowOpsController');
const { protect } = require('../../../middleware');
const { validate, mongoIdParam } = require('../validators');

router.use(protect);

router.get('/executions', listExecutions);
router.post('/executions/:id/replay', mongoIdParam, validate, replayExecution);

router.get('/webhook-deliveries', listWebhookDeliveries);
router.post('/webhook-deliveries/:id/retry', mongoIdParam, validate, retryWebhookDelivery);

router.post('/bookings/:id/retry-provider', mongoIdParam, validate, retryProvider);

module.exports = router;
