const express = require('express');
const router = express.Router();

const {
  getStatus,
  getGa4Report,
  getGscReport,
  getButtonBreakdown,
} = require('../controllers/mbrController');
const { protect } = require('../middleware');

// All MBR endpoints are admin-only dashboard reads
router.use(protect);

router.get('/status',  getStatus);
router.get('/ga4',     getGa4Report);
router.get('/gsc',     getGscReport);
router.get('/buttons', getButtonBreakdown);

module.exports = router;
