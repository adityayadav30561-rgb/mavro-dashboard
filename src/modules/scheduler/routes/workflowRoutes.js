const express = require('express');
const router = express.Router();
const {
  listWorkflows,
  createWorkflow,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
} = require('../controllers/workflowController');
const { protect } = require('../../../middleware');
const { validate, workflowCreateRules, mongoIdParam } = require('../validators');

router.use(protect);

router.get('/', listWorkflows);
router.post('/', workflowCreateRules, validate, createWorkflow);
router.get('/:id', mongoIdParam, validate, getWorkflow);
router.put('/:id', mongoIdParam, validate, updateWorkflow);
router.delete('/:id', mongoIdParam, validate, deleteWorkflow);

module.exports = router;
