const bcrypt = require('bcryptjs');
const { initDatabase } = require('../config/database');
const repo = require('../repositories/travelRepository');
const { cities, places, hotels, foods } = require('./sampleData');

const seed = async ({ force = true } = {}) => {
  initDatabase();
  if (force) repo.clearDemoData();
  if (!force && repo.hasCities()) return;

  const cityIds = {};
  cities.forEach((city) => {
    const saved = repo.createCity(city);
    cityIds[city.name] = saved._id;
  });

  Object.entries(places).forEach(([cityName, cityPlaces]) => {
    cityPlaces.forEach((place) => {
      repo.createPlace({
        cityId: cityIds[cityName],
        ...place,
      });
    });
  });

  Object.entries(hotels).forEach(([cityName, cityHotels]) => {
    cityHotels.forEach((hotel) => {
      repo.createHotel({
        cityId: cityIds[cityName],
        ...hotel,
      });
    });
  });

  Object.entries(foods).forEach(([cityName, cityFoods]) => {
    cityFoods.forEach((food) => {
      repo.createFood({
        cityId: cityIds[cityName],
        ...food,
        mustTry: true,
      });
    });
  });

  // SEED VISUAL CONTENT (Examples)
  if (cityIds['Ahmedabad']) {
    repo.createVisualContent({
      target_id: cityIds['Ahmedabad'], target_type: 'city', type: 'video',
      url: 'https://cdn.pixabay.com/video/2021/08/10/84545-585860474_large.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1595658658481-d53d3f999875?w=400',
      title: 'Ahmedabad Heritage Reel', category: 'Top Experiences', duration: '0:25', tags: 'heritage,cinematic'
    });
    repo.createVisualContent({
      target_id: cityIds['Ahmedabad'], target_type: 'city', type: 'panorama',
      url: 'https://images.unsplash.com/photo-1595658658481-d53d3f999875?w=1600',
      thumbnail: 'https://images.unsplash.com/photo-1595658658481-d53d3f999875?w=400',
      title: '360° Adalaj Stepwell', category: 'Hidden Gems', duration: 'N/A', tags: 'heritage,360'
    });
  }

  if (cityIds['Agra']) {
    repo.createVisualContent({
      target_id: cityIds['Agra'], target_type: 'city', type: 'video',
      url: 'https://cdn.pixabay.com/video/2020/09/24/50849-463200902_large.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400',
      title: 'Street Food of Agra', category: 'Nearby Attractions', duration: '0:20', tags: 'food,local'
    });
  }

  if (!repo.findUserByEmail('admin@bharat.com')) {
    repo.createUser({
      name: 'Admin',
      email: 'admin@bharat.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
    });
  }
};

if (require.main === module) {
  seed({ force: true })
    .then(() => {
      console.log('SQLite database seeded successfully.');
      console.log('Admin login: admin@bharat.com / admin123');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed error:', error);
      process.exit(1);
    });
}

module.exports = seed;
