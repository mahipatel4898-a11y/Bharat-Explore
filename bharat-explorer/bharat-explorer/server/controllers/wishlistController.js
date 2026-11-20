const repo = require('../repositories/travelRepository');

const getWishlist = async (req, res) => {
  try {
    const wishlist = repo.getWishlist(req.user._id);
    res.json({ success: true, data: wishlist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const { itemId, type, name, image, cityName } = req.body;
    const wishlist = repo.getWishlist(req.user._id);
    const exists = wishlist.items.find(i => i.itemId.toString() === itemId && i.type === type);
    if (exists) return res.status(400).json({ success: false, message: 'Already in wishlist' });
    const updated = repo.addWishlistItem(req.user._id, { itemId, type, name, image, cityName });
    res.json({ success: true, data: updated, message: 'Added to wishlist' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const wishlist = repo.removeWishlistItem(req.user._id, req.params.itemId);
    res.json({ success: true, data: wishlist, message: 'Removed from wishlist' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
