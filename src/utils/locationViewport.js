const HttpError = require('./httpError');

const parsePositiveInt = (value, fieldName) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, `${fieldName} phải là một số nguyên dương`);
  }
  return parsed;
};

const parseViewportQuery = (query) => {
  const { bbox, limit } = query || {};

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

  if (limit === undefined || limit === null) {
    throw new HttpError(400, 'limit là bắt buộc');
  }

  const parsedLimit = Number(limit);
  if (Number.isNaN(parsedLimit) || !Number.isInteger(parsedLimit) || parsedLimit <= 0) {
    throw new HttpError(400, 'limit phải là một số nguyên dương');
  }

  return {
    bounds: { minLng, minLat, maxLng, maxLat },
    limit: parsedLimit
  };
};

module.exports = {
  parseViewportQuery,
};
