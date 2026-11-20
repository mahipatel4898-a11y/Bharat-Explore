const express = require('express');
const router = express.Router();
const { getReviews, addReview, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:targetId', getReviews);
router.post('/', protect, addReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
