const express = require('express');
const router = express.Router();

const {
  getStatus,
  getGa4Report,
  getGscReport,
  getButtonBreakdown,
  getSections,
  listItems,
  createItem,
  updateItem,
  deleteItem,
  getBlogsReport,
  getBuiltPages,
  exportWorkbook,
} = require('../controllers/mbrController');
const { protect, blockRoles } = require('../middleware');

// All MBR endpoints are admin-only
// Lead-capture-only accounts must not reach this module. Nav hiding in the
// client is cosmetic — this is the actual gate.
router.use(protect, blockRoles('leads_agent'));

router.get('/status',   getStatus);
router.get('/ga4',      getGa4Report);
router.get('/gsc',      getGscReport);
router.get('/buttons',  getButtonBreakdown);
router.get('/sections', getSections);
router.get('/blogs',    getBlogsReport);
router.get('/pages',    getBuiltPages);
router.get('/export',   exportWorkbook);

// Manual workstream rows (PPTs/videos, work log, other projects, manual leads)
router.get('/items',        listItems);
router.post('/items',       createItem);
router.put('/items/:id',    updateItem);
router.delete('/items/:id', deleteItem);

module.exports = router;
