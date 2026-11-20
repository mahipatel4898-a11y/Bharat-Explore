const repo = require('../repositories/travelRepository');
const { mergeSortByPrice, mergeSortByRating } = require('../algorithms/sortHotels');
const { ensureCityGuide } = require('../services/cityEnrichmentService');

const getHotels = async (req, res) => {
  try {
    const { city, category, minPrice, maxPrice, sort } = req.query;
    if (city) await ensureCityGuide(city);
    let hotels = repo.getHotels({
      city,
      category,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });

    // Apply sorting algorithms
    if (sort === 'price_asc') hotels = mergeSortByPrice(hotels);
    else if (sort === 'price_desc') hotels = mergeSortByPrice(hotels).reverse();
    else if (sort === 'rating') hotels = mergeSortByRating(hotels);

    res.json({ success: true, data: hotels, sortApplied: sort || 'default' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getHotelById = async (req, res) => {
  try {
    const hotel = repo.getHotelById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    res.json({ success: true, data: hotel });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createHotel = async (req, res) => {
  try {
    const hotel = repo.createHotel(req.body);
    res.status(201).json({ success: true, data: hotel });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateHotel = async (req, res) => {
  try {
    const hotel = repo.updateHotel(req.params.id, req.body);
    res.json({ success: true, data: hotel });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteHotel = async (req, res) => {
  try {
    repo.deleteHotel(req.params.id);
    res.json({ success: true, message: 'Hotel deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getHotels, getHotelById, createHotel, updateHotel, deleteHotel };
