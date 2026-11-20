const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');

// Generate Trip Plan
router.post('/plan', async (req, res) => {
  try {
    const planData = req.body;
    // Check for destination and days (which represents duration)
    if (!planData.destination || (!planData.duration && !planData.days)) {
      return res.status(400).json({ error: "Destination and duration (days) are required" });
    }

    // Ensure aiService gets a duration field
    if (!planData.duration) planData.duration = planData.days;

    const itinerary = await aiService.generateItinerary(planData);
    res.json(itinerary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Chat
router.post('/chat', async (req, res) => {
  try {
    const { message, history, memory } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const reply = await aiService.chatWithAI(message, history, memory);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: "Bharat AI Guide could not process this request right now" });
  }
});

module.exports = router;
