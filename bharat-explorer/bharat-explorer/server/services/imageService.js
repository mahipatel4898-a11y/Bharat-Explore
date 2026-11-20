const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, '..', 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'image-cache.json');
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14;

let cache = null;

const FALLBACK_IMAGES = {
  place: [
    'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1400&h=900&q=85',
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1400&h=900&q=85',
    'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=1400&h=900&q=85',
    'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1400&h=900&q=85',
    'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1400&h=900&q=85',
  ],
  hotel: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&h=900&q=85',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1400&h=900&q=85',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1400&h=900&q=85',
    'https://images.unsplash.com/photo-1542314831-c6a4d14d8628?auto=format&fit=crop&w=1400&h=900&q=85',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1400&h=900&q=85',
  ],
  food: [
    'https://images.unsplash.com/photo-1567337710282-00832b415979?auto=format&fit=crop&w=1400&h=900&q=85',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&h=900&q=85',
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1400&h=900&q=85',
    'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=1400&h=900&q=85',
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1400&h=900&q=85',
  ],
  city: [
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1400&h=900&q=85',
    'https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&w=1400&h=900&q=85',
    'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1400&h=900&q=85',
    'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1400&h=900&q=85',
    'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1400&h=900&q=85',
  ],
};

const readCache = () => {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    cache = {};
  }
  return cache;
};

const writeCache = () => {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch {
    // Image cache is an optimization; failed writes should not break travel data.
  }
};

const withUnsplashSize = (url) => {
  if (!url) return '';
  const parsed = new URL(url);
  parsed.searchParams.set('auto', 'format');
  parsed.searchParams.set('fit', 'crop');
  parsed.searchParams.set('crop', 'entropy');
  parsed.searchParams.set('w', '1400');
  parsed.searchParams.set('h', '900');
  parsed.searchParams.set('fm', 'jpg');
  parsed.searchParams.set('q', '85');
  return parsed.toString();
};

const slugify = (value) =>
  String(value || 'india travel')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'india-travel';

const queryFromSlug = (slug) =>
  String(slug || 'india-travel')
    .replace(/\.jpg$/i, '')
    .replace(/-/g, ' ')
    .trim() || 'India travel';

const hashString = (value) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getPublicTravelImageUrl = (query, kind = 'place') =>
  `/api/images/travel/${encodeURIComponent(kind)}/${slugify(query)}.jpg`;

const getFallbackRemoteImage = (query, kind = 'place') => {
  const pool = FALLBACK_IMAGES[kind] || FALLBACK_IMAGES.place;
  return {
    url: withUnsplashSize(pool[hashString(`${kind}:${query}`) % pool.length]),
    source: 'curated-fallback',
    photographer: '',
    sourceUrl: 'https://unsplash.com/',
  };
};

const isBlockedImageUrl = (url) =>
  !url ||
  /google\.[^/]+\/imgres|source\.unsplash\.com|encrypted-tbn|gstatic\.com/i.test(url);

const hasImageFilePath = (url) => {
  try {
    const parsed = new URL(url, 'http://localhost');
    return /\.(jpe?g|png|webp)$/i.test(parsed.pathname);
  } catch {
    return false;
  }
};

const searchUnsplash = async (query) => {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;

  const url = new URL('https://api.unsplash.com/search/photos');
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', '1');
  url.searchParams.set('orientation', 'landscape');
  url.searchParams.set('content_filter', 'high');
  url.searchParams.set('order_by', 'relevant');

  const response = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${key}`,
      'Accept-Version': 'v1',
    },
  });

  if (!response.ok) return null;
  const data = await response.json();
  const photo = data.results?.[0];
  if (!photo) return null;

  return {
    url: withUnsplashSize(photo.urls?.raw || photo.urls?.regular),
    source: 'unsplash',
    photographer: photo.user?.name || '',
    sourceUrl: photo.links?.html || '',
  };
};

const searchPexels = async (query) => {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;

  const url = new URL('https://api.pexels.com/v1/search');
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', '1');
  url.searchParams.set('orientation', 'landscape');
  url.searchParams.set('size', 'large');

  const response = await fetch(url, {
    headers: { Authorization: key },
  });

  if (!response.ok) return null;
  const data = await response.json();
  const photo = data.photos?.[0];
  if (!photo) return null;

  return {
    url: photo.src?.large2x || photo.src?.large || photo.src?.landscape,
    source: 'pexels',
    photographer: photo.photographer || '',
    sourceUrl: photo.url || '',
  };
};

const getTravelImage = async (query) => {
  const normalizedQuery = String(query || 'India travel').trim();
  return {
    url: getPublicTravelImageUrl(normalizedQuery, 'place'),
    source: 'bharat-image-route',
    photographer: '',
    sourceUrl: '',
    query: normalizedQuery,
    cachedAt: Date.now(),
  };
};

const resolveRemoteTravelImage = async (query, kind = 'place') => {
  const normalizedQuery = String(query || 'India travel').trim();
  const cacheKey = normalizedQuery.toLowerCase();
  const imageCache = readCache();
  const cached = imageCache[`${kind}:${cacheKey}`];

  if (cached && !isBlockedImageUrl(cached.url) && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  let result = null;
  try {
    result = await searchUnsplash(normalizedQuery);
    if (!result) result = await searchPexels(normalizedQuery);
  } catch {
    result = null;
  }

  if (!result?.url) {
    result = getFallbackRemoteImage(normalizedQuery, kind);
  }

  imageCache[`${kind}:${cacheKey}`] = { ...result, query: normalizedQuery, kind, cachedAt: Date.now() };
  writeCache();
  return imageCache[`${kind}:${cacheKey}`];
};

module.exports = {
  getPublicTravelImageUrl,
  getTravelImage,
  hasImageFilePath,
  isBlockedImageUrl,
  queryFromSlug,
  resolveRemoteTravelImage,
};
