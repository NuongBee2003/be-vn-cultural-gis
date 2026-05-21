const { Op } = require('sequelize');
const db = require('../models');
const HttpError = require('../utils/httpError');
const { parseViewportQuery } = require('../utils/locationViewport');

const Location = db.Location;

class LocationController {
    parsePositiveInt(value, fieldName) {
        const parsed = Number(value);
        if (Number.isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
            throw new HttpError(400, `${fieldName} must be a positive integer`);
        }
        return parsed;
    }

    async getLocationsByViewport(query) {
        const parsed = parseViewportQuery(query);
        const { bounds, limit, place_id, district_id } = parsed;

        const where = {
            lat: { [Op.between]: [bounds.minLat, bounds.maxLat] },
            lng: { [Op.between]: [bounds.minLng, bounds.maxLng] },
        };

        if (place_id !== undefined) {
            where.place_id = place_id;
        }

        if (district_id !== undefined) {
            where.district_id = district_id;
        }

        return Location.findAll({
            attributes: ['id', 'lat', 'lng', 'address', 'place_id', 'district_id'],
            where,
            include: [
                {
                    model: db.Place,
                    as: 'place',
                    attributes: ['id', 'name'],
                    required: true,
                    include: [
                        {
                            model: db.Category,
                            as: 'category',
                            attributes: ['id', 'name', 'icon_marker'],
                            required: false,
                        },
                    ],
                },
            ],
            ...(limit ? { limit } : {}),
        });
    }

    async createLocation(payload, options = {}) {
        const { transaction } = options;
        const { lat, lng, address, place_id, district_id } = payload;

        const parsedPlaceId = this.parsePositiveInt(place_id, 'place_id');
        const parsedDistrictId = this.parsePositiveInt(district_id, 'district_id');

        const parsedLat = lat !== undefined && lat !== null ? Number(lat) : null;
        const parsedLng = lng !== undefined && lng !== null ? Number(lng) : null;
        if (parsedLat !== null && (Number.isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90)) {
            throw new HttpError(400, 'lat must be a number between -90 and 90');
        }
        if (parsedLng !== null && (Number.isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180)) {
            throw new HttpError(400, 'lng must be a number between -180 and 180');
        }

        return Location.create({
            lat: parsedLat,
            lng: parsedLng,
            address,
            place_id: parsedPlaceId,
            district_id: parsedDistrictId,
        }, transaction ? { transaction } : undefined);
    }

    async getLocationById(id) {
        return Location.findByPk(id);
    }

    async deleteLocation(location) {
        return location.destroy();
    }

    async getLocationsByCategory(categoryId) {
        return Location.findAll({
            attributes: ['id', 'lat', 'lng', 'address', 'place_id', 'district_id'],
            include: [
                {
                    model: db.Place,
                    as: 'place',
                    attributes: ['id', 'name', 'category_id'],
                    where: { category_id: categoryId },
                    required: true,
                    include: [
                        {
                            model: db.Category,
                            as: 'category',
                            attributes: ['id', 'name', 'icon_marker'],
                            required: false,
                        },
                    ],
                },
            ],
        });
    }
}

module.exports = new LocationController();
