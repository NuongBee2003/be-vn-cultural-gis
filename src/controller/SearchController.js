const { getClient, isEnabled } = require('../services/elasticsearchClient');

class SearchController {
    getPlaceLocationsIndex() {
        return process.env.ELASTICSEARCH_PLACE_LOCATIONS_INDEX || 'place_locations';
    }

    parseNumber(value, fieldName) {
        const parsed = Number(value);
        if (Number.isNaN(parsed)) {
            const err = new Error(`${fieldName} must be a number`);
            err.statusCode = 400;
            err.code = 'VALIDATION_ERROR';
            err.expose = true;
            throw err;
        }
        return parsed;
    }

    parseOptionalPositiveInt(value, fieldName, fallback) {
        if (value === undefined || value === null || value === '') return fallback;
        const parsed = Number(value);
        if (Number.isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
            const err = new Error(`${fieldName} must be a positive integer`);
            err.statusCode = 400;
            err.code = 'VALIDATION_ERROR';
            err.expose = true;
            throw err;
        }
        return parsed;
    }

    tryParseLatLngFromQuery(q) {
        if (!q || typeof q !== 'string') return null;
        const m = q.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
        if (!m) return null;
        const lat = Number(m[1]);
        const lon = Number(m[2]);
        if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
        if (lat < -90 || lat > 90) return null;
        if (lon < -180 || lon > 180) return null;
        return { lat, lon };
    }

    async searchPlaceLocations({ q, lat, lng, radius = '200m', size = 20 }) {
        if (!isEnabled()) {
            const err = new Error('Elasticsearch is not enabled. Set ELASTICSEARCH_URL.');
            err.statusCode = 503;
            err.code = 'ELASTICSEARCH_DISABLED';
            err.expose = true;
            throw err;
        }

        const client = getClient();
        if (!client) {
            const err = new Error('Elasticsearch client is not available');
            err.statusCode = 503;
            err.code = 'ELASTICSEARCH_UNAVAILABLE';
            err.expose = true;
            throw err;
        }

        const index = this.getPlaceLocationsIndex();
        const finalSize = this.parseOptionalPositiveInt(size, 'size', 20);

        const parsedFromQ = this.tryParseLatLngFromQuery(q);

        let query;
        let sort;
        let mode;

        if (lat !== undefined || lng !== undefined) {
            const finalLat = this.parseNumber(lat, 'lat');
            const finalLon = this.parseNumber(lng, 'lng');
            mode = 'geo';
            query = {
                geo_distance: {
                    distance: radius,
                    geo: { lat: finalLat, lon: finalLon },
                },
            };
            sort = [
                {
                    _geo_distance: {
                        geo: { lat: finalLat, lon: finalLon },
                        order: 'asc',
                        unit: 'm',
                    },
                },
            ];
        } else if (parsedFromQ) {
            mode = 'geo';
            query = {
                geo_distance: {
                    distance: radius,
                    geo: { lat: parsedFromQ.lat, lon: parsedFromQ.lon },
                },
            };
            sort = [
                {
                    _geo_distance: {
                        geo: { lat: parsedFromQ.lat, lon: parsedFromQ.lon },
                        order: 'asc',
                        unit: 'm',
                    },
                },
            ];
        } else {
            const text = typeof q === 'string' ? q.trim() : '';
            if (!text) {
                const err = new Error('q is required (text) or provide lat,lng');
                err.statusCode = 400;
                err.code = 'VALIDATION_ERROR';
                err.expose = true;
                throw err;
            }

            mode = 'text';
            query = {
                multi_match: {
                    query: text,
                    fields: ['name^3', 'address^2', 'description'],
                    fuzziness: 'AUTO',
                    operator: 'and',
                    prefix_length: 1,
                },
            };
        }

        const result = await client.search({
            index,
            size: finalSize,
            query,
            ...(sort ? { sort } : {}),
        });

        const hits = result?.hits?.hits || [];

        return {
            mode,
            total: typeof result?.hits?.total === 'number' ? result.hits.total : result?.hits?.total?.value,
            items: hits.map((h) => ({
                id: h?._id,
                score: h?._score,
                ...((h && h._source) || {}),
            })),
        };
    }
}

module.exports = new SearchController();
