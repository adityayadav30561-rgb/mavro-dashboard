const express = require('express');
const router = express.Router();
const {
  listEventTypes,
  createEventType,
  getEventType,
  updateEventType,
  setEventTypeActive,
  deleteEventType,
  duplicateEventType,
} = require('../controllers/eventTypeController');
const {
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
} = require('../controllers/formQuestionController');
const { protect } = require('../../../middleware');
const {
  validate,
  eventTypeCreateRules,
  eventTypeUpdateRules,
  mongoIdParam,
} = require('../validators');

router.use(protect);

// ─── EventType CRUD ───
router.get('/', listEventTypes);
router.post('/', eventTypeCreateRules, validate, createEventType);
router.get('/:id', mongoIdParam, validate, getEventType);
router.put('/:id', eventTypeUpdateRules, validate, updateEventType);
router.delete('/:id', mongoIdParam, validate, deleteEventType);

// ─── EventType state ops ───
router.patch('/:id/active', mongoIdParam, validate, setEventTypeActive);
router.post('/:id/duplicate', mongoIdParam, validate, duplicateEventType);

// ─── FormQuestion nested CRUD ───
router.get('/:eventTypeId/questions', listQuestions);
router.post('/:eventTypeId/questions', createQuestion);
router.put('/:eventTypeId/questions/reorder', reorderQuestions);
router.put('/:eventTypeId/questions/:id', updateQuestion);
router.delete('/:eventTypeId/questions/:id', deleteQuestion);

module.exports = router;
