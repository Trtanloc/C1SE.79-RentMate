const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const assetBaseCandidate =
  import.meta.env.VITE_ASSET_BASE_URL ||
  (API_BASE_URL.startsWith('http') ? API_BASE_URL.replace(/\/api\/?$/, '') : '');

export const assetBaseUrl = assetBaseCandidate.replace(/\/$/, '');

export const resolveAssetUrl = (url) => {
  if (!url) {
    return null;
  }
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  if (!assetBaseUrl) {
    return normalizedPath;
  }
  return `${assetBaseUrl}${normalizedPath}`;
};
