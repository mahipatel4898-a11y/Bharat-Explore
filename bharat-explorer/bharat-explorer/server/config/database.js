const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const dbPath = process.env.SQLITE_DB_PATH || path.join(__dirname, '..', 'database', 'bharat_explorer.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA foreign_keys = ON');

const now = () => new Date().toISOString();
const json = (value, fallback = []) => JSON.stringify(value ?? fallback);
const parseJson = (value, fallback = []) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      avatar TEXT DEFAULT '',
      search_history TEXT DEFAULT '[]',
      recently_viewed TEXT DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      state TEXT NOT NULL,
      description TEXT NOT NULL,
      image TEXT NOT NULL,
      cover_image TEXT DEFAULT '',
      lat REAL,
      lng REAL,
      best_season TEXT,
      avg_budget INTEGER DEFAULT 3000,
      highlights TEXT DEFAULT '[]',
      tags TEXT DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tourist_places (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      images TEXT DEFAULT '[]',
      lat REAL,
      lng REAL,
      visiting_time TEXT DEFAULT '9 AM - 6 PM',
      entry_fee INTEGER DEFAULT 0,
      type TEXT DEFAULT 'historical',
      rating REAL DEFAULT 4.0,
      duration TEXT DEFAULT '1-2 hours',
      tips TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS hotels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      images TEXT DEFAULT '[]',
      lat REAL,
      lng REAL,
      price_per_night INTEGER NOT NULL,
      rating REAL DEFAULT 4.0,
      amenities TEXT DEFAULT '[]',
      contact TEXT DEFAULT '',
      website TEXT DEFAULT '',
      category TEXT DEFAULT 'mid-range',
      address TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS food_places (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city_id INTEGER NOT NULL,
      dish_name TEXT NOT NULL,
      description TEXT DEFAULT '',
      images TEXT DEFAULT '[]',
      restaurant_name TEXT DEFAULT '',
      address TEXT DEFAULT '',
      lat REAL,
      lng REAL,
      price_range TEXT DEFAULT 'Rs 100-Rs 300',
      is_veg INTEGER DEFAULT 1,
      rating REAL DEFAULT 4.0,
      must_try INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_id TEXT NOT NULL,
      type TEXT NOT NULL,
      name TEXT DEFAULT '',
      image TEXT DEFAULT '',
      city_name TEXT DEFAULT '',
      added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, item_id, type),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      user_name TEXT DEFAULT '',
      user_avatar TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS visual_content (
      _id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_id INTEGER,
      target_type TEXT,
      type TEXT,
      url TEXT,
      thumbnail TEXT,
      title TEXT,
      category TEXT,
      duration TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS trip_planner (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      city_id INTEGER,
      days INTEGER DEFAULT 2,
      budget INTEGER DEFAULT 5000,
      plan_json TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      hotel_id INTEGER NOT NULL,
      hotel_name TEXT NOT NULL,
      hotel_image TEXT DEFAULT '',
      city_name TEXT DEFAULT '',
      check_in TEXT NOT NULL,
      check_out TEXT NOT NULL,
      guests INTEGER NOT NULL DEFAULT 1,
      rooms INTEGER NOT NULL DEFAULT 1,
      total_price INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      special_requests TEXT DEFAULT '',
      payment_method TEXT DEFAULT 'card',
      payment_status TEXT DEFAULT 'paid',
      transaction_id TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
    );
  `);

  // Migrations: add payment columns to existing bookings table if absent
  const migrations = [
    `ALTER TABLE bookings ADD COLUMN payment_method TEXT DEFAULT 'card'`,
    `ALTER TABLE bookings ADD COLUMN payment_status TEXT DEFAULT 'paid'`,
    `ALTER TABLE bookings ADD COLUMN transaction_id TEXT DEFAULT ''`,
  ];
  for (const sql of migrations) {
    try { db.exec(sql); } catch { /* column already exists — safe to ignore */ }
  }
};

const cityShape = (row) => row && ({
  _id: String(row.id),
  id: row.id,
  name: row.name,
  state: row.state,
  description: row.description,
  image: row.image,
  coverImage: row.cover_image || '',
  coordinates: { lat: row.lat, lng: row.lng },
  bestSeason: row.best_season,
  avgBudget: row.avg_budget,
  highlights: parseJson(row.highlights),
  tags: parseJson(row.tags),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const cityRef = (row) => row && ({
  _id: String(row.city_id),
  id: row.city_id,
  name: row.city_name,
  state: row.city_state,
});

const placeShape = (row) => row && ({
  _id: String(row.id),
  id: row.id,
  cityId: row.city_name ? cityRef(row) : String(row.city_id),
  name: row.name,
  description: row.description,
  images: parseJson(row.images),
  coordinates: { lat: row.lat, lng: row.lng },
  visitingTime: row.visiting_time,
  entryFee: row.entry_fee,
  type: row.type,
  rating: row.rating,
  duration: row.duration,
  tips: row.tips,
  tags: parseJson(row.tags),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const hotelShape = (row) => row && ({
  _id: String(row.id),
  id: row.id,
  cityId: row.city_name ? cityRef(row) : String(row.city_id),
  name: row.name,
  description: row.description,
  images: parseJson(row.images),
  coordinates: { lat: row.lat, lng: row.lng },
  pricePerNight: row.price_per_night,
  rating: row.rating,
  amenities: parseJson(row.amenities),
  contact: row.contact,
  website: row.website,
  category: row.category,
  address: row.address,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const foodShape = (row) => row && ({
  _id: String(row.id),
  id: row.id,
  cityId: row.city_name ? cityRef(row) : String(row.city_id),
  dishName: row.dish_name,
  description: row.description,
  images: parseJson(row.images),
  restaurantName: row.restaurant_name,
  address: row.address,
  coordinates: { lat: row.lat, lng: row.lng },
  priceRange: row.price_range,
  isVeg: Boolean(row.is_veg),
  rating: row.rating,
  mustTry: Boolean(row.must_try),
  tags: parseJson(row.tags),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const userShape = (row, includePassword = false) => {
  if (!row) return null;
  const user = {
    _id: String(row.id),
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatar: row.avatar || '',
    searchHistory: parseJson(row.search_history),
    recentlyViewed: parseJson(row.recently_viewed),
    createdAt: row.created_at,
  };
  if (includePassword) user.password = row.password;
  return user;
};

const bookingShape = (row) => row && ({
  _id: String(row.id),
  id: row.id,
  userId: row.user_id,
  hotelId: row.hotel_id,
  hotelName: row.hotel_name,
  hotelImage: row.hotel_image || '',
  cityName: row.city_name || '',
  checkIn: row.check_in,
  checkOut: row.check_out,
  guests: row.guests,
  rooms: row.rooms,
  totalPrice: row.total_price,
  status: row.status,
  specialRequests: row.special_requests || '',
  paymentMethod: row.payment_method || 'card',
  paymentStatus: row.payment_status || 'paid',
  transactionId: row.transaction_id || '',
  createdAt: row.created_at,
});

module.exports = { db, initDatabase, now, json, cityShape, placeShape, hotelShape, foodShape, userShape, bookingShape };
