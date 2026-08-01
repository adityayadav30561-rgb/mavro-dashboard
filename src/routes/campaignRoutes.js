const express = require('express');
const router = express.Router();
const {
  listCampaigns,
  createCampaign,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  assignBlogs,
} = require('../controllers/campaignController');
const { protect, blockRoles } = require('../middleware');

// Lead-capture-only accounts must not reach this module. Nav hiding in the
// client is cosmetic — this is the actual gate.
router.use(protect, blockRoles('leads_agent'));

router.get('/',                listCampaigns);
router.post('/',               createCampaign);
router.get('/:id',             getCampaign);
router.put('/:id',             updateCampaign);
router.delete('/:id',          deleteCampaign);
router.post('/:id/assign-blogs', assignBlogs);

module.exports = router;
