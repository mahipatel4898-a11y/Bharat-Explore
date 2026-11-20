const express = require('express');
const router = express.Router();
const { planTrip, chatbot } = require('../controllers/tripController');
const { protect } = require('../middleware/authMiddleware');

router.post('/plan', planTrip);
router.post('/chat', chatbot);

module.exports = router;
