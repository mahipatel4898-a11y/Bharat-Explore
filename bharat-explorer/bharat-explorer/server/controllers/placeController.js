const repo = require('../repositories/travelRepository');
const { getOptimalRoute } = require('../algorithms/dijkstra');
const { ensureCityGuide } = require('../services/cityEnrichmentService');

const getPlaces = async (req, res) => {
  try {
    const { city, type, minFee, maxFee } = req.query;
    if (city) await ensureCityGuide(city);
    const places = repo.getPlaces({
      city,
      type,
      minFee: minFee ? Number(minFee) : undefined,
      maxFee: maxFee ? Number(maxFee) : undefined,
    });
    res.json({ success: true, data: places });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getPlaceById = async (req, res) => {
  try {
    const place = repo.getPlaceById(req.params.id);
    if (!place) return res.status(404).json({ success: false, message: 'Place not found' });
    res.json({ success: true, data: place });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOptimalTouristRoute = async (req, res) => {
  try {
    const { cityId } = req.params;
    const places = repo.getPlaces({ city: cityId });
    const route = getOptimalRoute(places);
    res.json({ success: true, data: route, algorithm: 'Nearest Neighbour (Dijkstra-based)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createPlace = async (req, res) => {
  try {
    const place = repo.createPlace(req.body);
    res.status(201).json({ success: true, data: place });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updatePlace = async (req, res) => {
  try {
    const place = repo.updatePlace(req.params.id, req.body);
    res.json({ success: true, data: place });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deletePlace = async (req, res) => {
  try {
    repo.deletePlace(req.params.id);
    res.json({ success: true, message: 'Place deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getPlaces, getPlaceById, getOptimalTouristRoute, createPlace, updatePlace, deletePlace };
