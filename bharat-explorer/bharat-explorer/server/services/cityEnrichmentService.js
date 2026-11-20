const repo = require('../repositories/travelRepository');
const { getCityRecommendations } = require('../data/richCityRecommendations');
const { getPublicTravelImageUrl, hasImageFilePath, isBlockedImageUrl } = require('./imageService');

const TARGET_COUNT = 5;
const inFlight = new Map();

const normalize = (value) =>
  String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const hasDynamicImage = (item) => {
  const image = item?.images?.[0] || item?.image || '';
  if (isBlockedImageUrl(image)) return false;
  if (/^\/api\/images\/travel\/[^/]+\/[^/]+\.jpg$/i.test(image)) return true;
  if (!hasImageFilePath(image)) return false;
  if (/source\.unsplash\.com/i.test(image)) return /1400x900|1200x800|1600x1000/i.test(image);
  if (/images\.pexels\.com/i.test(image)) return true;
  if (/images\.unsplash\.com/i.test(image)) {
    try {
      const width = Number(new URL(image).searchParams.get('w') || 0);
      return width >= 1080;
    } catch {
      return false;
    }
  }
  return false;
};

const itemImage = async (city, type, name, customQuery) => {
  const baseQuery = customQuery || (
    type === 'hotel'
      ? `${name} luxury hotel ${city.name}`
      : type === 'food'
        ? `${name} ${city.name} food`
        : `${name} ${city.name}`
  );

  return getPublicTravelImageUrl(baseQuery, type);
};

const orderedGuideItems = (items, guideItems, nameSelector) => {
  const byName = new Map(items.map((item) => [normalize(nameSelector(item)), item]));
  const ordered = guideItems
    .map((guideItem) => byName.get(normalize(guideItem[0])))
    .filter(Boolean);

  const extras = items.filter((item) => !ordered.some((orderedItem) => orderedItem._id === item._id));
  return [...ordered, ...extras].slice(0, TARGET_COUNT);
};

const ensurePlaces = async (city, guide) => {
  let existing = repo.getPlaces({ city: city.id });
  const existingByName = new Map(existing.map((item) => [normalize(item.name), item]));

  for (const [name, description, type] of guide.places.slice(0, TARGET_COUNT)) {
    const current = existingByName.get(normalize(name));
    const image = !current || !hasDynamicImage(current)
      ? await itemImage(city, 'place', name)
      : current.images[0];

    const payload = {
      cityId: city.id,
      name,
      description,
      images: [image],
      coordinates: city.coordinates,
      visitingTime: current?.visitingTime || '9 AM - 6 PM',
      entryFee: current?.entryFee ?? 0,
      type,
      rating: current?.rating || 4.7,
      duration: current?.duration || '1-2 hours',
      tips: current?.tips || 'Book popular experiences early and verify opening hours before visiting.',
      tags: current?.tags?.length ? current.tags : [type, city.name.toLowerCase()],
    };

    if (current) repo.updatePlace(current.id, payload);
    else repo.createPlace(payload);
  }

  existing = repo.getPlaces({ city: city.id });
  return orderedGuideItems(existing, guide.places, (item) => item.name);
};

const ensureHotels = async (city, guide) => {
  let existing = repo.getHotels({ city: city.id });
  const existingByName = new Map(existing.map((item) => [normalize(item.name), item]));

  for (const [name, description, category, pricePerNight] of guide.hotels.slice(0, TARGET_COUNT)) {
    const current = existingByName.get(normalize(name));
    const image = !current || !hasDynamicImage(current)
      ? await itemImage(city, 'hotel', name)
      : current.images[0];

    const payload = {
      cityId: city.id,
      name,
      description,
      images: [image],
      coordinates: city.coordinates,
      pricePerNight: current?.pricePerNight || pricePerNight,
      rating: current?.rating || 4.6,
      amenities: current?.amenities?.length ? current.amenities : ['WiFi', 'Restaurant', 'Concierge'],
      contact: current?.contact || '',
      website: current?.website || '',
      category,
      address: current?.address || city.name,
    };

    if (current) repo.updateHotel(current.id, payload);
    else repo.createHotel(payload);
  }

  existing = repo.getHotels({ city: city.id });
  return orderedGuideItems(existing, guide.hotels, (item) => item.name);
};

const ensureFoods = async (city, guide) => {
  let existing = repo.getFoods({ city: city.id });
  const existingByName = new Map(existing.map((item) => [normalize(item.dishName), item]));

  for (const [dishName, description, isVeg, priceRange] of guide.foods.slice(0, TARGET_COUNT)) {
    const current = existingByName.get(normalize(dishName));
    const image = !current || !hasDynamicImage(current)
      ? await itemImage(city, 'food', dishName)
      : current.images[0];

    const atIndex = dishName.toLowerCase().indexOf(' at ');
    const restaurantName = current?.restaurantName || (atIndex > -1 ? dishName.slice(atIndex + 4) : city.name);

    const payload = {
      cityId: city.id,
      dishName,
      description,
      images: [image],
      restaurantName,
      address: current?.address || city.name,
      coordinates: city.coordinates,
      priceRange: current?.priceRange || priceRange,
      isVeg,
      rating: current?.rating || 4.6,
      mustTry: current?.mustTry ?? true,
      tags: current?.tags?.length ? current.tags : ['local food', city.name.toLowerCase()],
    };

    if (current) repo.updateFood(current.id, payload);
    else repo.createFood(payload);
  }

  existing = repo.getFoods({ city: city.id });
  return orderedGuideItems(existing, guide.foods, (item) => item.dishName);
};

const enrichCityGuide = async (cityId) => {
  const city = repo.getCityById(cityId);
  if (!city) return null;

  const guide = getCityRecommendations(city.name);
  if (!guide) {
    return {
      city,
      places: repo.getPlaces({ city: city.id }).slice(0, TARGET_COUNT),
      hotels: repo.getHotels({ city: city.id }).slice(0, TARGET_COUNT),
      foods: repo.getFoods({ city: city.id }).slice(0, TARGET_COUNT),
      enriched: false,
    };
  }

  const [places, hotels, foods] = await Promise.all([
    ensurePlaces(city, guide),
    ensureHotels(city, guide),
    ensureFoods(city, guide),
  ]);

  return { city, places, hotels, foods, enriched: true };
};

const ensureCityGuide = (cityId) => {
  const key = String(cityId);
  if (!inFlight.has(key)) {
    inFlight.set(
      key,
      enrichCityGuide(cityId).finally(() => {
        inFlight.delete(key);
      })
    );
  }

  return inFlight.get(key);
};

module.exports = { ensureCityGuide, TARGET_COUNT };
