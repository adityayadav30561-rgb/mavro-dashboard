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
const { protect } = require('../middleware');

router.use(protect);

router.get('/',                listCampaigns);
router.post('/',               createCampaign);
router.get('/:id',             getCampaign);
router.put('/:id',             updateCampaign);
router.delete('/:id',          deleteCampaign);
router.post('/:id/assign-blogs', assignBlogs);

module.exports = router;
