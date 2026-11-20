const express = require('express');
const router = express.Router();
const { queryFromSlug, resolveRemoteTravelImage } = require('../services/imageService');

const FALLBACK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="0 0 1400 900">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#090d14"/>
      <stop offset="0.52" stop-color="#111827"/>
      <stop offset="1" stop-color="#2a1f0f"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="44%" r="56%">
      <stop offset="0" stop-color="#d8a84e" stop-opacity="0.34"/>
      <stop offset="1" stop-color="#d8a84e" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1400" height="900" fill="url(#bg)"/>
  <rect width="1400" height="900" fill="url(#glow)"/>
  <text x="700" y="432" fill="#f8fafc" font-family="Arial, sans-serif" font-size="68" font-weight="700" text-anchor="middle">Bharat Explorer</text>
  <text x="700" y="496" fill="#d8a84e" font-family="Arial, sans-serif" font-size="28" letter-spacing="5" text-anchor="middle">TRAVEL IMAGE</text>
</svg>
`.trim();

const sendFallbackImage = (res) => {
  res.status(200).set({
    'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    'Content-Type': 'image/svg+xml; charset=utf-8',
    'Cross-Origin-Resource-Policy': 'cross-origin',
  });
  res.send(FALLBACK_SVG);
};

router.get('/travel/:kind/:slug.jpg', async (req, res) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const kind = ['city', 'place', 'hotel', 'food'].includes(req.params.kind)
      ? req.params.kind
      : 'place';
    const query = queryFromSlug(req.params.slug);
    const image = await resolveRemoteTravelImage(query, kind);
    const response = await fetch(image.url, {
      signal: controller.signal,
      headers: {
        Accept: 'image/jpeg,image/webp,image/png,*/*;q=0.8',
        'User-Agent': 'Bharat Explorer image proxy',
      },
    });

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.startsWith('image/')) {
      clearTimeout(timeout);
      return sendFallbackImage(res);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    clearTimeout(timeout);
    res.status(200).set({
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'Content-Type': contentType,
      'Content-Length': buffer.length,
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'X-Image-Provider': image.source || 'remote',
    });
    res.send(buffer);
  } catch {
    clearTimeout(timeout);
    sendFallbackImage(res);
  }
});

module.exports = router;
