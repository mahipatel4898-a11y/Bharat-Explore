const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { initDatabase } = require('./config/database');
const seedDatabase = require('./data/seedData');
const repo = require('./repositories/travelRepository');

dotenv.config();
initDatabase();

const ensureAdminUser = async () => {
  if (!repo.findUserByEmail('admin@bharat.com')) {
    const hashed = await bcrypt.hash('admin123', 10);
    repo.createUser({
      name: 'Admin',
      email: 'admin@bharat.com',
      password: hashed,
      role: 'admin',
    });
    console.log('Demo admin ready: admin@bharat.com / admin123');
  }
};

ensureAdminUser().catch((error) => {
  console.error('Admin bootstrap error:', error.message);
});

if (!repo.hasCities()) {
  seedDatabase({ force: false }).catch((error) => {
    console.error('SQLite seed error:', error.message);
  });
}

const app = express();

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/cities', require('./routes/cityRoutes'));
app.use('/api/places', require('./routes/placeRoutes'));
app.use('/api/hotels', require('./routes/hotelRoutes'));
app.use('/api/food', require('./routes/foodRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/trip', require('./routes/tripRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/weather', require('./routes/weatherRoutes'));
app.use('/api/visual', require('./routes/visualRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/images', require('./routes/imageRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', database: 'SQLite', message: 'Bharat Explorer API is running!' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

module.exports = app;
