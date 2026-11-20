const express = require('express');
const router = express.Router();
const repo = require('../repositories/travelRepository');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/stats', protect, adminOnly, (req, res) => {
  try {
    res.json({ success: true, data: repo.counts() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/users', protect, adminOnly, (req, res) => {
  try {
    res.json({ success: true, data: repo.getUsers() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/users/:id', protect, adminOnly, (req, res) => {
  try {
    repo.deleteUser(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/city', protect, adminOnly, (req, res) => {
  try {
    res.status(201).json({ success: true, data: repo.createCity(req.body) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/city/:id', protect, adminOnly, (req, res) => {
  try {
    res.json({ success: true, data: repo.updateCity(req.params.id, req.body) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/city/:id', protect, adminOnly, (req, res) => {
  try {
    repo.deleteCity(req.params.id);
    res.json({ success: true, message: 'City deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/place', protect, adminOnly, (req, res) => {
  try {
    res.status(201).json({ success: true, data: repo.createPlace(req.body) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/place/:id', protect, adminOnly, (req, res) => {
  try {
    res.json({ success: true, data: repo.updatePlace(req.params.id, req.body) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/place/:id', protect, adminOnly, (req, res) => {
  try {
    repo.deletePlace(req.params.id);
    res.json({ success: true, message: 'Place deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/hotel', protect, adminOnly, (req, res) => {
  try {
    res.status(201).json({ success: true, data: repo.createHotel(req.body) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/hotel/:id', protect, adminOnly, (req, res) => {
  try {
    res.json({ success: true, data: repo.updateHotel(req.params.id, req.body) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/hotel/:id', protect, adminOnly, (req, res) => {
  try {
    repo.deleteHotel(req.params.id);
    res.json({ success: true, message: 'Hotel deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/food', protect, adminOnly, (req, res) => {
  try {
    res.status(201).json({ success: true, data: repo.createFood(req.body) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/food/:id', protect, adminOnly, (req, res) => {
  try {
    res.json({ success: true, data: repo.updateFood(req.params.id, req.body) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/food/:id', protect, adminOnly, (req, res) => {
  try {
    repo.deleteFood(req.params.id);
    res.json({ success: true, message: 'Food deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
