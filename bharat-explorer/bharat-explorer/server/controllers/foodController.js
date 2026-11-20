const repo = require('../repositories/travelRepository');
const { ensureCityGuide } = require('../services/cityEnrichmentService');

const getFoods = async (req, res) => {
  try {
    const { city, isVeg, mustTry } = req.query;
    if (city) await ensureCityGuide(city);
    const foods = repo.getFoods({
      city,
      isVeg: isVeg === undefined ? undefined : (isVeg === 'true' ? 1 : 0),
      mustTry,
    });
    res.json({ success: true, data: foods });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getFoodById = async (req, res) => {
  try {
    const food = repo.getFoodById(req.params.id);
    if (!food) return res.status(404).json({ success: false, message: 'Food not found' });
    res.json({ success: true, data: food });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createFood = async (req, res) => {
  try {
    const food = repo.createFood(req.body);
    res.status(201).json({ success: true, data: food });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateFood = async (req, res) => {
  try {
    const food = repo.updateFood(req.params.id, req.body);
    res.json({ success: true, data: food });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteFood = async (req, res) => {
  try {
    repo.deleteFood(req.params.id);
    res.json({ success: true, message: 'Food deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getFoods, getFoodById, createFood, updateFood, deleteFood };
