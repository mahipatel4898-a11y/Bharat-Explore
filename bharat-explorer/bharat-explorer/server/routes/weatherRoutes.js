const express = require('express');
const router = express.Router();
const repo = require('../repositories/travelRepository');

// GET /api/weather/:city or GET /api/weather?lat=...&lng=...
router.get('/:city?', async (req, res) => {
  const { city: cityName } = req.params;
  const { lat: qLat, lng: qLng } = req.query;

  try {
    let lat, lng, finalName = cityName;

    if (qLat && qLng) {
      // Use provided coordinates directly
      lat = qLat;
      lng = qLng;
      
      // Attempt Reverse Geocoding to get Area Name
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
          headers: { 'User-Agent': 'BharatExplorer/1.0' }
        });
        const geoData = await geoRes.json();
        const addr = geoData.address;
        finalName = addr.city || addr.town || addr.village || addr.suburb || addr.state_district || addr.state || 'India';
      } catch (e) {
        finalName = 'India';
      }
    } else if (cityName) {
      // Find city in DB to get its coordinates
      const allCities = repo.getCities();
      const city = allCities.find(c => c.name.toLowerCase() === cityName.toLowerCase());
      
      if (!city || !city.coordinates?.lat) {
        throw new Error('City coordinates not found');
      }
      lat = city.coordinates.lat;
      lng = city.coordinates.lng;
    } else {
      return res.status(400).json({ success: false, message: 'City or coordinates required' });
    }

    // 2. Fetch LIVE weather from Open-Meteo (No API Key Required)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Open-Meteo API error');
    
    const weatherData = await response.json();
    const current = weatherData.current;
    const daily = weatherData.daily;

    // Map WMO Weather Codes to our strings
    const interpretCode = (code) => {
      if (code === 0) return 'Clear';
      if (code <= 3) return 'Partly Cloudy';
      if (code <= 48) return 'Mist';
      if (code <= 67) return 'Rain';
      if (code <= 82) return 'Rain';
      if (code <= 99) return 'Thunderstorm';
      return 'Cloudy';
    };

    const data = {
      location: finalName,
      temp: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      high: Math.round(daily.temperature_2m_max[0]),
      low: Math.round(daily.temperature_2m_min[0]),
      condition: interpretCode(current.weather_code),
      humidity: current.relative_humidity_2m,
      wind: Math.round(current.wind_speed_10m), // km/h
      isMock: false
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('Weather error:', error);
    // Fallback
    res.json({ 
      success: true, 
      data: {
        location: cityName || 'Location',
        temp: 28,
        feelsLike: 30,
        high: 32,
        low: 26,
        condition: 'Clear',
        humidity: 65,
        wind: 12,
        isMock: true
      } 
    });
  }
});

module.exports = router;
