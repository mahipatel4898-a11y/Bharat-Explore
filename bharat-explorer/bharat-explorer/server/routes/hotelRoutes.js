const express = require('express');
const router = express.Router();
const { getHotels, getHotelById, createHotel, updateHotel, deleteHotel } = require('../controllers/hotelController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', getHotels);
router.get('/:id', getHotelById);
router.post('/', protect, adminOnly, createHotel);
router.put('/:id', protect, adminOnly, updateHotel);
router.delete('/:id', protect, adminOnly, deleteHotel);

module.exports = router;
