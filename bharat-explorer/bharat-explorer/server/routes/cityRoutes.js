const express = require('express');
const router = express.Router();
const { getAllCities, getCityById, getCityTravelGuide, createCity, updateCity, deleteCity } = require('../controllers/cityController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', getAllCities);
router.get('/:id/travel-guide', getCityTravelGuide);
router.get('/:id', getCityById);
router.post('/', protect, adminOnly, createCity);
router.put('/:id', protect, adminOnly, updateCity);
router.delete('/:id', protect, adminOnly, deleteCity);

module.exports = router;
