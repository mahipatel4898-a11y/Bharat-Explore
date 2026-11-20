const express = require('express');
const router = express.Router();
const repo = require('../repositories/travelRepository');

// Get visual content for a city or hotel
router.get('/:targetType/:targetId', (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const content = repo.getVisualContent(targetId, targetType);
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Add visual content
router.post('/', (req, res) => {
  try {
    const result = repo.createVisualContent(req.body);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
