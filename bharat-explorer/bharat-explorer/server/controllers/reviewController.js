const repo = require('../repositories/travelRepository');

const getReviews = async (req, res) => {
  try {
    const reviews = repo.getReviews(req.params.targetId);
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const addReview = async (req, res) => {
  try {
    const { targetId, targetType, rating, comment } = req.body;
    const review = repo.createReview({
      userId: req.user._id,
      userName: req.user.name,
      userAvatar: req.user.avatar,
      targetId, targetType, rating, comment
    });
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const review = repo.getReviewById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (String(review.user_id) !== String(req.user._id) && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });
    repo.deleteReview(req.params.id);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getReviews, addReview, deleteReview };
