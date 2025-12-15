const EMBED_BASE = 'https://www.google.com/maps/embed';

const parseLatLngFromPath = (pathname) => {
  const atPart = pathname.split('@')[1];
  if (!atPart) return null;
  const [lat, lng] = atPart.split(',');
  if (!lat || !lng) return null;
  return { lat, lng };
};

const parsePlaceQuery = (pathname) => {
  const placeIndex = pathname.toLowerCase().indexOf('/maps/place/');
  if (placeIndex === -1) return null;
  const rest = pathname.slice(placeIndex + '/maps/place/'.length);
  const beforeData = rest.split('/data')[0] || rest;
  const cleaned = beforeData.replace(/\+/g, ' ').trim();
  if (!cleaned) return null;
  try {
    return decodeURIComponent(cleaned);
  } catch {
    return cleaned;
  }
};

/**
 * Convert common Google Maps URLs into an embeddable URL.
 * Falls back to the original URL if it is already embeddable or cannot be parsed.
 */
export const toGoogleMapsEmbedUrl = (input, fallbackQuery) => {
  const raw = (input || '').trim();
  const fallback = (fallbackQuery || '').trim();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY;

  if (!raw && !fallback) return '';
  if (raw.includes('/maps/embed')) return raw;

  const buildPlaceEmbed = (query) =>
    `${EMBED_BASE}/v1/place?key=${apiKey}&q=${encodeURIComponent(query)}`;
  const buildViewEmbed = ({ lat, lng }) =>
    `${EMBED_BASE}/v1/view?key=${apiKey}&center=${lat},${lng}&zoom=16`;

  let url = null;
  if (raw) {
    try {
      url = new URL(raw);
    } catch {
      url = null;
    }
  }

  if (!apiKey) {
    // Without a key, return the provided URL (if any) rather than building a new embed.
    return raw || '';
  }

  if (url && url.hostname.includes('google.')) {
    const latLng = parseLatLngFromPath(url.pathname);
    if (latLng) {
      return buildViewEmbed(latLng);
    }
    const placeQuery = parsePlaceQuery(url.pathname);
    const q = placeQuery || url.searchParams.get('q') || fallback;
    if (q) {
      return buildPlaceEmbed(q);
    }
    return raw || fallback;
  }

  // Allow plain addresses (or free text) to be converted when no valid Google Maps URL is provided.
  if (!url && raw) {
    return buildPlaceEmbed(raw);
  }

  if (!raw && fallback) {
    return buildPlaceEmbed(fallback);
  }

  return raw || fallback;
};
