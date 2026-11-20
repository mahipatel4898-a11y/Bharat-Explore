const repo = require('../repositories/travelRepository');
const { ensureCityGuide } = require('../services/cityEnrichmentService');
const { getPublicTravelImageUrl, hasImageFilePath, isBlockedImageUrl } = require('../services/imageService');

const withSafeCityImage = (city) => {
  if (!city) return city;
  const query = `${city.name} ${city.state} India travel`;
  const image = (!city.image || isBlockedImageUrl(city.image) || !hasImageFilePath(city.image))
    ? getPublicTravelImageUrl(query, 'city')
    : city.image;
  const coverImage = (!city.coverImage || isBlockedImageUrl(city.coverImage) || !hasImageFilePath(city.coverImage))
    ? getPublicTravelImageUrl(`${city.name} ${city.state} landmark`, 'city')
    : city.coverImage;

  return { ...city, image, coverImage };
};

const getAllCities = async (req, res) => {
  try {
    const cities = repo.getCities().map(withSafeCityImage);
    res.json({ success: true, data: cities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getCityById = async (req, res) => {
  try {
    const city = withSafeCityImage(repo.getCityById(req.params.id));
    if (!city) return res.status(404).json({ success: false, message: 'City not found' });
    res.json({ success: true, data: city });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getCityTravelGuide = async (req, res) => {
  try {
    const guide = await ensureCityGuide(req.params.id);
    if (!guide) return res.status(404).json({ success: false, message: 'City not found' });
    res.json({ success: true, data: { ...guide, city: withSafeCityImage(guide.city) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createCity = async (req, res) => {
  try {
    const city = repo.createCity(req.body);
    res.status(201).json({ success: true, data: city });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateCity = async (req, res) => {
  try {
    const city = repo.updateCity(req.params.id, req.body);
    if (!city) return res.status(404).json({ success: false, message: 'City not found' });
    res.json({ success: true, data: city });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteCity = async (req, res) => {
  try {
    repo.deleteCity(req.params.id);
    res.json({ success: true, message: 'City deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllCities, getCityById, getCityTravelGuide, createCity, updateCity, deleteCity };
