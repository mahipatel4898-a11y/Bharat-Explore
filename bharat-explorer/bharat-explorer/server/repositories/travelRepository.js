const { db, now, json, cityShape, placeShape, hotelShape, foodShape, userShape } = require('../config/database');

const citySelect = 'SELECT * FROM cities';
const joinedPlaceSelect = `
  SELECT p.*, c.name AS city_name, c.state AS city_state
  FROM tourist_places p JOIN cities c ON c.id = p.city_id
`;
const joinedHotelSelect = `
  SELECT h.*, c.name AS city_name, c.state AS city_state
  FROM hotels h JOIN cities c ON c.id = h.city_id
`;
const joinedFoodSelect = `
  SELECT f.*, c.name AS city_name, c.state AS city_state
  FROM food_places f JOIN cities c ON c.id = f.city_id
`;

const like = (value) => `%${value}%`;

const runFilters = (baseSql, filters, orderSql = '') => {
  const where = [];
  const params = {};
  filters.forEach(({ sql, key, value }) => {
    if (value !== undefined && value !== null && value !== '') {
      where.push(sql);
      params[key] = value;
    }
  });
  const sql = `${baseSql} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ${orderSql}`;
  return db.prepare(sql).all(params);
};

const toBool = (value, fallback = true) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  return Boolean(value);
};

const toCityId = (value) => {
  if (value === undefined || value === null || value === '') return value;
  if (typeof value === 'object') return Number(value._id ?? value.id);
  return Number(value);
};

const toCoord = (value) => (value === undefined || value === null || value === '' ? null : Number(value));

const createCity = (data) => {
  const stmt = db.prepare(`
    INSERT INTO cities (name, state, description, image, cover_image, lat, lng, best_season, avg_budget, highlights, tags, created_at, updated_at)
    VALUES (@name, @state, @description, @image, @coverImage, @lat, @lng, @bestSeason, @avgBudget, @highlights, @tags, @createdAt, @updatedAt)
  `);
  const info = stmt.run({
    name: data.name,
    state: data.state,
    description: data.description || '',
    image: data.image || '/fallback-travel.svg',
    coverImage: data.coverImage || '',
    lat: toCoord(data.coordinates?.lat),
    lng: toCoord(data.coordinates?.lng),
    bestSeason: data.bestSeason || '',
    avgBudget: Number(data.avgBudget) || 3000,
    highlights: json(data.highlights),
    tags: json(data.tags),
    createdAt: now(),
    updatedAt: now(),
  });
  return getCityById(info.lastInsertRowid);
};

const updateCity = (id, data) => {
  const existing = getCityById(id);
  if (!existing) return null;
  db.prepare(`
    UPDATE cities SET name=@name, state=@state, description=@description, image=@image, cover_image=@coverImage,
      lat=@lat, lng=@lng, best_season=@bestSeason, avg_budget=@avgBudget, highlights=@highlights, tags=@tags, updated_at=@updatedAt
    WHERE id=@id
  `).run({
    id,
    name: data.name ?? existing.name,
    state: data.state ?? existing.state,
    description: data.description ?? existing.description,
    image: data.image ?? existing.image,
    coverImage: data.coverImage ?? existing.coverImage,
    lat: data.coordinates?.lat !== undefined ? toCoord(data.coordinates.lat) : toCoord(existing.coordinates?.lat),
    lng: data.coordinates?.lng !== undefined ? toCoord(data.coordinates.lng) : toCoord(existing.coordinates?.lng),
    bestSeason: data.bestSeason ?? existing.bestSeason,
    avgBudget: data.avgBudget !== undefined ? Number(data.avgBudget) : existing.avgBudget,
    highlights: json(data.highlights ?? existing.highlights),
    tags: json(data.tags ?? existing.tags),
    updatedAt: now(),
  });
  return getCityById(id);
};

const getCityById = (id) => cityShape(db.prepare(`${citySelect} WHERE id = ?`).get(id));
const getCityByName = (name) => cityShape(db.prepare(`${citySelect} WHERE name = ? COLLATE NOCASE`).get(name));
const getCities = () => db.prepare(`${citySelect} ORDER BY name ASC`).all().map(cityShape);
const deleteCity = (id) => db.prepare('DELETE FROM cities WHERE id = ?').run(id);

const createPlace = (data) => {
  const info = db.prepare(`
    INSERT INTO tourist_places (city_id, name, description, images, lat, lng, visiting_time, entry_fee, type, rating, duration, tips, tags, created_at, updated_at)
    VALUES (@cityId, @name, @description, @images, @lat, @lng, @visitingTime, @entryFee, @type, @rating, @duration, @tips, @tags, @createdAt, @updatedAt)
  `).run({
    cityId: toCityId(data.cityId),
    name: data.name,
    description: data.description || '',
    images: json(data.images),
    lat: toCoord(data.coordinates?.lat),
    lng: toCoord(data.coordinates?.lng),
    visitingTime: data.visitingTime || '9 AM - 6 PM',
    entryFee: Number(data.entryFee) || 0,
    type: data.type || 'historical',
    rating: Number(data.rating) || 4,
    duration: data.duration || '1-2 hours',
    tips: data.tips || '',
    tags: json(data.tags),
    createdAt: now(),
    updatedAt: now(),
  });
  return getPlaceById(info.lastInsertRowid);
};

const updatePlace = (id, data) => {
  const existing = getPlaceById(id);
  if (!existing) return null;
  db.prepare(`
    UPDATE tourist_places SET city_id=@cityId, name=@name, description=@description, images=@images, lat=@lat, lng=@lng,
      visiting_time=@visitingTime, entry_fee=@entryFee, type=@type, rating=@rating, duration=@duration, tips=@tips, tags=@tags, updated_at=@updatedAt
    WHERE id=@id
  `).run({
    id,
    cityId: toCityId(data.cityId ?? existing.cityId._id ?? existing.cityId),
    name: data.name ?? existing.name,
    description: data.description ?? existing.description,
    images: json(data.images ?? existing.images),
    lat: data.coordinates?.lat ?? existing.coordinates.lat,
    lng: data.coordinates?.lng ?? existing.coordinates.lng,
    visitingTime: data.visitingTime ?? existing.visitingTime,
    entryFee: data.entryFee !== undefined ? Number(data.entryFee) : existing.entryFee,
    type: data.type ?? existing.type,
    rating: data.rating !== undefined ? Number(data.rating) : existing.rating,
    duration: data.duration ?? existing.duration,
    tips: data.tips ?? existing.tips,
    tags: json(data.tags ?? existing.tags),
    updatedAt: now(),
  });
  return getPlaceById(id);
};

const getPlaces = (query = {}) => runFilters(joinedPlaceSelect, [
  { sql: 'p.city_id = @city', key: 'city', value: query.city },
  { sql: 'p.type = @type', key: 'type', value: query.type },
  { sql: 'p.entry_fee >= @minFee', key: 'minFee', value: query.minFee },
  { sql: 'p.entry_fee <= @maxFee', key: 'maxFee', value: query.maxFee },
], 'ORDER BY p.rating DESC').map(placeShape);
const getPlaceById = (id) => placeShape(db.prepare(`${joinedPlaceSelect} WHERE p.id = ?`).get(id));
const deletePlace = (id) => db.prepare('DELETE FROM tourist_places WHERE id = ?').run(id);

const createHotel = (data) => {
  const info = db.prepare(`
    INSERT INTO hotels (city_id, name, description, images, lat, lng, price_per_night, rating, amenities, contact, website, category, address, created_at, updated_at)
    VALUES (@cityId, @name, @description, @images, @lat, @lng, @pricePerNight, @rating, @amenities, @contact, @website, @category, @address, @createdAt, @updatedAt)
  `).run({
    cityId: toCityId(data.cityId),
    name: data.name,
    description: data.description || '',
    images: json(data.images),
    lat: toCoord(data.coordinates?.lat),
    lng: toCoord(data.coordinates?.lng),
    pricePerNight: Number(data.pricePerNight) || 0,
    rating: Number(data.rating) || 4,
    amenities: json(data.amenities),
    contact: data.contact || '',
    website: data.website || '',
    category: data.category || 'mid-range',
    address: data.address || '',
    createdAt: now(),
    updatedAt: now(),
  });
  return getHotelById(info.lastInsertRowid);
};

const updateHotel = (id, data) => {
  const existing = getHotelById(id);
  if (!existing) return null;
  db.prepare(`
    UPDATE hotels SET city_id=@cityId, name=@name, description=@description, images=@images, lat=@lat, lng=@lng,
      price_per_night=@pricePerNight, rating=@rating, amenities=@amenities, contact=@contact, website=@website,
      category=@category, address=@address, updated_at=@updatedAt WHERE id=@id
  `).run({
    id,
    cityId: toCityId(data.cityId ?? existing.cityId._id ?? existing.cityId),
    name: data.name ?? existing.name,
    description: data.description ?? existing.description,
    images: json(data.images ?? existing.images),
    lat: data.coordinates?.lat ?? existing.coordinates.lat,
    lng: data.coordinates?.lng ?? existing.coordinates.lng,
    pricePerNight: data.pricePerNight !== undefined ? Number(data.pricePerNight) : existing.pricePerNight,
    rating: data.rating !== undefined ? Number(data.rating) : existing.rating,
    amenities: json(data.amenities ?? existing.amenities),
    contact: data.contact ?? existing.contact,
    website: data.website ?? existing.website,
    category: data.category ?? existing.category,
    address: data.address ?? existing.address,
    updatedAt: now(),
  });
  return getHotelById(id);
};

const getHotels = (query = {}) => runFilters(joinedHotelSelect, [
  { sql: 'h.city_id = @city', key: 'city', value: query.city },
  { sql: 'h.category = @category', key: 'category', value: query.category },
  { sql: 'h.price_per_night >= @minPrice', key: 'minPrice', value: query.minPrice },
  { sql: 'h.price_per_night <= @maxPrice', key: 'maxPrice', value: query.maxPrice },
], 'ORDER BY h.rating DESC').map(hotelShape);
const getHotelById = (id) => hotelShape(db.prepare(`${joinedHotelSelect} WHERE h.id = ?`).get(id));
const deleteHotel = (id) => db.prepare('DELETE FROM hotels WHERE id = ?').run(id);

const createFood = (data) => {
  const info = db.prepare(`
    INSERT INTO food_places (city_id, dish_name, description, images, restaurant_name, address, lat, lng, price_range, is_veg, rating, must_try, tags, created_at, updated_at)
    VALUES (@cityId, @dishName, @description, @images, @restaurantName, @address, @lat, @lng, @priceRange, @isVeg, @rating, @mustTry, @tags, @createdAt, @updatedAt)
  `).run({
    cityId: toCityId(data.cityId),
    dishName: data.dishName,
    description: data.description || '',
    images: json(data.images),
    restaurantName: data.restaurantName || '',
    address: data.address || '',
    lat: toCoord(data.coordinates?.lat),
    lng: toCoord(data.coordinates?.lng),
    priceRange: data.priceRange || 'Rs 100-Rs 300',
    isVeg: toBool(data.isVeg, true) ? 1 : 0,
    rating: Number(data.rating) || 4,
    mustTry: data.mustTry ? 1 : 0,
    tags: json(data.tags),
    createdAt: now(),
    updatedAt: now(),
  });
  return getFoodById(info.lastInsertRowid);
};

const updateFood = (id, data) => {
  const existing = getFoodById(id);
  if (!existing) return null;
  db.prepare(`
    UPDATE food_places SET city_id=@cityId, dish_name=@dishName, description=@description, images=@images,
      restaurant_name=@restaurantName, address=@address, lat=@lat, lng=@lng, price_range=@priceRange,
      is_veg=@isVeg, rating=@rating, must_try=@mustTry, tags=@tags, updated_at=@updatedAt WHERE id=@id
  `).run({
    id,
    cityId: toCityId(data.cityId ?? existing.cityId._id ?? existing.cityId),
    dishName: data.dishName ?? existing.dishName,
    description: data.description ?? existing.description,
    images: json(data.images ?? existing.images),
    restaurantName: data.restaurantName ?? existing.restaurantName,
    address: data.address ?? existing.address,
    lat: data.coordinates?.lat ?? existing.coordinates.lat,
    lng: data.coordinates?.lng ?? existing.coordinates.lng,
    priceRange: data.priceRange ?? existing.priceRange,
    isVeg: toBool(data.isVeg ?? existing.isVeg, true) ? 1 : 0,
    rating: data.rating !== undefined ? Number(data.rating) : existing.rating,
    mustTry: (data.mustTry ?? existing.mustTry) ? 1 : 0,
    tags: json(data.tags ?? existing.tags),
    updatedAt: now(),
  });
  return getFoodById(id);
};

const getFoods = (query = {}) => runFilters(joinedFoodSelect, [
  { sql: 'f.city_id = @city', key: 'city', value: query.city },
  { sql: 'f.is_veg = @isVeg', key: 'isVeg', value: query.isVeg === undefined ? undefined : query.isVeg },
  { sql: 'f.must_try = @mustTry', key: 'mustTry', value: query.mustTry ? 1 : undefined },
], 'ORDER BY f.rating DESC').map(foodShape);
const getFoodById = (id) => foodShape(db.prepare(`${joinedFoodSelect} WHERE f.id = ?`).get(id));
const deleteFood = (id) => db.prepare('DELETE FROM food_places WHERE id = ?').run(id);

const findUserByEmail = (email, includePassword = false) =>
  userShape(db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase()), includePassword);
const findUserById = (id, includePassword = false) =>
  userShape(db.prepare('SELECT * FROM users WHERE id = ?').get(id), includePassword);
const createUser = ({ name, email, password, role = 'user' }) => {
  const info = db.prepare('INSERT INTO users (name, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(name, String(email).toLowerCase(), password, role, now(), now());
  return findUserById(info.lastInsertRowid);
};
const getUsers = () => db.prepare('SELECT * FROM users ORDER BY created_at DESC').all().map((row) => userShape(row));
const deleteUser = (id) => db.prepare('DELETE FROM users WHERE id = ?').run(id);

const getWishlist = (userId) => ({
  _id: String(userId),
  userId: String(userId),
  items: db.prepare('SELECT * FROM wishlist WHERE user_id = ? ORDER BY added_at DESC').all(userId).map((item) => ({
    _id: String(item.id),
    itemId: item.item_id,
    type: item.type,
    name: item.name,
    image: item.image,
    cityName: item.city_name,
    addedAt: item.added_at,
  })),
});
const addWishlistItem = (userId, item) => {
  db.prepare('INSERT INTO wishlist (user_id, item_id, type, name, image, city_name, added_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(userId, item.itemId, item.type, item.name || '', item.image || '', item.cityName || '', now());
  return getWishlist(userId);
};
const removeWishlistItem = (userId, itemId) => {
  db.prepare('DELETE FROM wishlist WHERE user_id = ? AND item_id = ?').run(userId, itemId);
  return getWishlist(userId);
};

const getReviews = (targetId) => db.prepare('SELECT * FROM reviews WHERE target_id = ? ORDER BY created_at DESC')
  .all(targetId)
  .map((row) => ({
    _id: String(row.id),
    id: row.id,
    userId: String(row.user_id),
    targetId: row.target_id,
    targetType: row.target_type,
    rating: row.rating,
    comment: row.comment,
    userName: row.user_name,
    userAvatar: row.user_avatar,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
const createReview = ({ userId, userName, userAvatar = '', targetId, targetType, rating, comment }) => {
  const info = db.prepare(`
    INSERT INTO reviews (user_id, target_id, target_type, rating, comment, user_name, user_avatar, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId, targetId, targetType, rating, comment, userName, userAvatar, now(), now());
  return getReviews(targetId).find((review) => review.id === Number(info.lastInsertRowid));
};
const getReviewById = (id) => db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
const deleteReview = (id) => db.prepare('DELETE FROM reviews WHERE id = ?').run(id);

const searchAll = ({ q, city, type }) => {
  const term = like(q);
  const cityMatches = db.prepare(`
    SELECT * FROM cities
    WHERE name LIKE @term OR state LIKE @term OR description LIKE @term OR tags LIKE @term OR highlights LIKE @term
    ORDER BY name
  `).all({ term });
  const matchedCityIds = cityMatches.map((row) => row.id);
  const cityIds = city ? [Number(city)] : matchedCityIds;
  const cityParams = {};
  const cityOr = cityIds.length
    ? ` OR city_id IN (${cityIds.map((id, index) => {
        cityParams[`city${index}`] = id;
        return `@city${index}`;
      }).join(',')})`
    : '';

  return {
    cities: cityMatches.map(cityShape),
    places: db.prepare(`
      ${joinedPlaceSelect}
      WHERE (
        p.name LIKE @term OR p.description LIKE @term OR p.type LIKE @term OR p.tags LIKE @term
        OR c.name LIKE @term OR c.state LIKE @term ${cityOr.replaceAll('city_id', 'p.city_id')}
      )
      ${type ? 'AND p.type = @type' : ''}
      ORDER BY p.rating DESC
    `).all(type ? { term, type, ...cityParams } : { term, ...cityParams }).map(placeShape),
    hotels: db.prepare(`
      ${joinedHotelSelect}
      WHERE (
        h.name LIKE @term OR h.description LIKE @term OR h.category LIKE @term OR h.amenities LIKE @term
        OR c.name LIKE @term OR c.state LIKE @term ${cityOr.replaceAll('city_id', 'h.city_id')}
      )
      ORDER BY h.rating DESC
    `).all({ term, ...cityParams }).map(hotelShape),
    foods: db.prepare(`
      ${joinedFoodSelect}
      WHERE (
        f.dish_name LIKE @term OR f.restaurant_name LIKE @term OR f.description LIKE @term OR f.tags LIKE @term
        OR c.name LIKE @term OR c.state LIKE @term ${cityOr.replaceAll('city_id', 'f.city_id')}
      )
      ORDER BY f.rating DESC
    `).all({ term, ...cityParams }).map(foodShape),
  };
};



const counts = () => ({
  cities: db.prepare('SELECT COUNT(*) AS count FROM cities').get().count,
  places: db.prepare('SELECT COUNT(*) AS count FROM tourist_places').get().count,
  hotels: db.prepare('SELECT COUNT(*) AS count FROM hotels').get().count,
  foods: db.prepare('SELECT COUNT(*) AS count FROM food_places').get().count,
  users: db.prepare('SELECT COUNT(*) AS count FROM users').get().count,
  reviews: db.prepare('SELECT COUNT(*) AS count FROM reviews').get().count,
});

const clearDemoData = () => db.exec(`
  DELETE FROM reviews;
  DELETE FROM wishlist;
  DELETE FROM trip_planner;
  DELETE FROM food_places;
  DELETE FROM hotels;
  DELETE FROM tourist_places;
  DELETE FROM cities;
  DELETE FROM visual_content;
  DELETE FROM sqlite_sequence WHERE name IN ('reviews','wishlist','trip_planner','food_places','hotels','tourist_places','cities','visual_content');
`);

const getVisualContent = (targetId, targetType) => 
  db.prepare('SELECT * FROM visual_content WHERE target_id = ? AND target_type = ?').all(targetId, targetType);

const createVisualContent = (data) => {
  const { target_id, target_type, type, url, thumbnail, title, category, duration, tags } = data;
  return db.prepare(`
    INSERT INTO visual_content (target_id, target_type, type, url, thumbnail, title, category, duration, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(target_id, target_type, type, url, thumbnail, title, category, duration, tags);
};
const hasCities = () => db.prepare('SELECT COUNT(*) AS count FROM cities').get().count > 0;

module.exports = {
  createCity, updateCity, getCityById, getCityByName, getCities, deleteCity,
  createPlace, updatePlace, getPlaces, getPlaceById, deletePlace,
  createHotel, updateHotel, getHotels, getHotelById, deleteHotel,
  createFood, updateFood, getFoods, getFoodById, deleteFood,
  findUserByEmail, findUserById, createUser, getUsers, deleteUser,
  getWishlist, addWishlistItem, removeWishlistItem,
  getReviews, createReview, getReviewById, deleteReview,
  searchAll, counts, clearDemoData, hasCities,
  getVisualContent, createVisualContent,
};
