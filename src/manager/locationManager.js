const { Op } = require('sequelize');
const db = require('../models');

const Location = db.Location;
const ALLOWED_STATUS = ['pending', 'accepted', 'rejected'];

class LocationManager {
    parseViewportQuery(query) {
        const { bbox, limit, status, place_id, province_id } = query;

        if (!bbox) {
            const error = new Error('bbox is required. Expected format: minLng,minLat,maxLng,maxLat');
            error.statusCode = 400;
            throw error;
        }

        const parts = String(bbox).split(',').map((value) => Number(value.trim()));
        if (parts.length !== 4 || parts.some((value) => Number.isNaN(value))) {
            const error = new Error('bbox must contain 4 numeric values: minLng,minLat,maxLng,maxLat');
            error.statusCode = 400;
            throw error;
        }

        const [minLng, minLat, maxLng, maxLat] = parts;
        if (minLng >= maxLng || minLat >= maxLat) {
            const error = new Error('bbox is invalid. minLng < maxLng and minLat < maxLat are required');
            error.statusCode = 400;
            throw error;
        }
        if (minLng < -180 || maxLng > 180 || minLat < -90 || maxLat > 90) {
            const error = new Error('bbox coordinates are out of range');
            error.statusCode = 400;
            throw error;
        }

        let parsedLimit;
        if (limit !== undefined) {
            parsedLimit = Number(limit);
            if (Number.isNaN(parsedLimit) || !Number.isInteger(parsedLimit) || parsedLimit <= 0) {
                const error = new Error('limit must be a positive integer');
                error.statusCode = 400;
                throw error;
            }
        }

        const parsedStatus = status || 'accepted';
        if (!ALLOWED_STATUS.includes(parsedStatus)) {
            const error = new Error(`status must be one of: ${ALLOWED_STATUS.join(', ')}`);
            error.statusCode = 400;
            throw error;
        }

        let parsedPlaceId;
        if (place_id !== undefined) {
            parsedPlaceId = Number(place_id);
            if (Number.isNaN(parsedPlaceId) || !Number.isInteger(parsedPlaceId) || parsedPlaceId <= 0) {
                const error = new Error('place_id must be a positive integer');
                error.statusCode = 400;
                throw error;
            }
        }

        let parsedProvinceId;
        if (province_id !== undefined) {
            parsedProvinceId = Number(province_id);
            if (Number.isNaN(parsedProvinceId) || !Number.isInteger(parsedProvinceId) || parsedProvinceId <= 0) {
                const error = new Error('province_id must be a positive integer');
                error.statusCode = 400;
                throw error;
            }
        }

        return {
            bounds: { minLng, minLat, maxLng, maxLat },
            limit: parsedLimit,
            status: parsedStatus,
            place_id: parsedPlaceId,
            province_id: parsedProvinceId
        };
    }

    async getAllLocations() {
        return Location.findAll();
    }

    async getLocationsByViewport(query) {
        const parsed = this.parseViewportQuery(query);
        const { bounds, limit, status, place_id, province_id } = parsed;

        const where = {
            lat: { [Op.between]: [bounds.minLat, bounds.maxLat] },
            lng: { [Op.between]: [bounds.minLng, bounds.maxLng] },
            status
        };

        if (place_id !== undefined) {
            where.place_id = place_id;
        }

        if (province_id !== undefined) {
            where.province_id = province_id;
        }

        return Location.findAll({
            attributes: ['id', 'lat', 'lng', 'address', 'place_id', 'province_id', 'status'],
            where,
            ...(limit ? { limit } : {})
        });
    }

    async createLocation(payload) {
        const { lat, lng, province_id, status, address, place_id } = payload;
        return Location.create({
            lat,
            lng,
            province_id,
            status,
            address,
            place_id
        });
    }

    async getLocationById(id) {
        return Location.findByPk(id);
    }

    async deleteLocation(location) {
        return location.destroy();
    }
}

module.exports = new LocationManager();
