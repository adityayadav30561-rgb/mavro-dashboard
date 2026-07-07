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
  exportWorkbook,
} = require('../controllers/mbrController');
const { protect } = require('../middleware');

// All MBR endpoints are admin-only
router.use(protect);

router.get('/status',   getStatus);
router.get('/ga4',      getGa4Report);
router.get('/gsc',      getGscReport);
router.get('/buttons',  getButtonBreakdown);
router.get('/sections', getSections);
router.get('/blogs',    getBlogsReport);
router.get('/export',   exportWorkbook);

// Manual workstream rows (PPTs/videos, work log, other projects, manual leads)
router.get('/items',        listItems);
router.post('/items',       createItem);
router.put('/items/:id',    updateItem);
router.delete('/items/:id', deleteItem);

module.exports = router;
