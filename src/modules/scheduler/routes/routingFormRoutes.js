const express = require('express');
const router = express.Router();
const {
  listForms, createForm, getForm, updateForm, deleteForm,
} = require('../controllers/routingFormController');
const { protect } = require('../../../middleware');
const { validate, mongoIdParam } = require('../validators');

router.use(protect);

router.get('/', listForms);
router.post('/', createForm);
router.get('/:id', mongoIdParam, validate, getForm);
router.put('/:id', mongoIdParam, validate, updateForm);
router.delete('/:id', mongoIdParam, validate, deleteForm);

module.exports = router;
