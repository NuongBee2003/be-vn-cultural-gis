const HttpError = require('./httpError');

const parsePositiveInt = (value, fieldName) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, `${fieldName} must be a positive integer`);
  }
  return parsed;
};

const parseViewportQuery = (query) => {
  const { bbox, limit, place_id, district_id } = query || {};

  if (!bbox) {
    throw new HttpError(
      400,
      'bbox is required. Expected format: minLng,minLat,maxLng,maxLat'
    );
  }

  const parts = String(bbox)
    .split(',')
    .map((value) => Number(value.trim()));

  if (parts.length !== 4 || parts.some((value) => Number.isNaN(value))) {
    throw new HttpError(
      400,
      'bbox must contain 4 numeric values: minLng,minLat,maxLng,maxLat'
    );
  }

  const [minLng, minLat, maxLng, maxLat] = parts;

  if (minLng >= maxLng || minLat >= maxLat) {
    throw new HttpError(
      400,
      'bbox is invalid. minLng < maxLng and minLat < maxLat are required'
    );
  }

  if (minLng < -180 || maxLng > 180 || minLat < -90 || maxLat > 90) {
    throw new HttpError(400, 'bbox coordinates are out of range');
  }

  let parsedLimit;
  if (limit !== undefined) {
    parsedLimit = Number(limit);
    if (
      Number.isNaN(parsedLimit) ||
      !Number.isInteger(parsedLimit) ||
      parsedLimit <= 0
    ) {
      throw new HttpError(400, 'limit must be a positive integer');
    }
  }

  let parsedPlaceId;
  if (place_id !== undefined) {
    parsedPlaceId = parsePositiveInt(place_id, 'place_id');
  }

  let parsedDistrictId;
  if (district_id !== undefined) {
    parsedDistrictId = parsePositiveInt(district_id, 'district_id');
  }

  return {
    bounds: { minLng, minLat, maxLng, maxLat },
    limit: parsedLimit,
    place_id: parsedPlaceId,
    district_id: parsedDistrictId,
  };
};

const isInViewport = (location, bounds) => {
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return false;

  return (
    lat >= bounds.minLat &&
    lat <= bounds.maxLat &&
    lng >= bounds.minLng &&
    lng <= bounds.maxLng
  );
};

// Pure in-memory filter for testing the viewport loading logic.
// This mirrors the DB query that LocationManager runs.
const filterLocationsByViewport = (locations, query) => {
  const parsed = parseViewportQuery(query);
  const { bounds, limit, place_id, district_id } = parsed;

  let result = (locations || []).filter((location) => isInViewport(location, bounds));

  if (place_id !== undefined) {
    result = result.filter((location) => Number(location.place_id) === place_id);
  }

  if (district_id !== undefined) {
    result = result.filter((location) => Number(location.district_id) === district_id);
  }

  if (limit !== undefined) {
    result = result.slice(0, limit);
  }

  return { result, parsed };
};

module.exports = {
  parseViewportQuery,
  filterLocationsByViewport,
};
