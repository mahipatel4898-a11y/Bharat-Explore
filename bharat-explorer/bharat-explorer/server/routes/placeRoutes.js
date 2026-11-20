const express = require('express');
const router = express.Router();
const { getPlaces, getPlaceById, getOptimalTouristRoute, createPlace, updatePlace, deletePlace } = require('../controllers/placeController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', getPlaces);
router.get('/route/:cityId', getOptimalTouristRoute);
router.get('/:id', getPlaceById);
router.post('/', protect, adminOnly, createPlace);
router.put('/:id', protect, adminOnly, updatePlace);
router.delete('/:id', protect, adminOnly, deletePlace);

module.exports = router;
