const repo = require('../repositories/travelRepository');

const globalSearch = async (req, res) => {
  try {
    const { q, city, type } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Query required' });

    const { cities, places, hotels, foods } = repo.searchAll({ q, city, type });

    const results = { cities, places, hotels, foods };
    const suggestions = [
      ...cities.map((item) => item.name),
      ...places.map((item) => item.name),
      ...hotels.map((item) => item.name),
      ...foods.map((item) => item.dishName),
    ].slice(0, 8);

    res.json({
      success: true,
      query: q,
      data: results,
      results,
      suggestions,
      total: cities.length + places.length + hotels.length + foods.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { globalSearch };
