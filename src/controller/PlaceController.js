const db = require('../models');

class PlaceController {
    parsePositiveInt(value, fieldName) {
        const parsed = Number(value);
        if (Number.isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
            const err = new Error(`${fieldName} must be a positive integer`);
            err.statusCode = 400;
            throw err;
        }
        return parsed;
    }

    parseOptionalLatLng(value, fieldName, min, max) {
        if (value === undefined || value === null || value === '') return null;
        const parsed = Number(value);
        if (Number.isNaN(parsed) || parsed < min || parsed > max) {
            const err = new Error(`${fieldName} must be a number between ${min} and ${max}`);
            err.statusCode = 400;
            throw err;
        }
        return parsed;
    }

    async getAllPlaces() {
        return db.Place.findAll();
    }

    async getPlaceWithLocations(id) {
        const placeId = this.parsePositiveInt(id, 'id');
        return db.Place.findByPk(placeId, {
            include: [
                {
                    model: db.Category,
                    as: 'category',
                    attributes: ['id', 'name', 'icon_marker'],
                    required: false,
                },
                {
                    model: db.Location,
                    as: 'locations',
                    attributes: ['id', 'lat', 'lng', 'address', 'district_id'],
                    required: false,
                    include: [
                        {
                            model: db.District,
                            as: 'district',
                            attributes: ['id', 'name'],
                            required: false,
                        },
                    ],
                },
            ],
        });
    }

    async createPlace(payload, options = {}) {
        const { transaction } = options;
        const { name, description, category_id, status } = payload || {};

        if (!name || typeof name !== 'string') {
            const err = new Error('name is required');
            err.statusCode = 400;
            throw err;
        }

        return db.Place.create(
            {
                name,
                description,
                category_id,
                status,
            },
            transaction ? { transaction } : undefined
        );
    }

    async updatePlace(id, payload) {
        const placeId = this.parsePositiveInt(id, 'id');

        const place = await db.Place.findByPk(placeId);
        if (!place) {
            const err = new Error('Place not found');
            err.statusCode = 404;
            throw err;
        }

        const { name, description, category_id, status } = payload || {};

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (category_id !== undefined) updates.category_id = category_id;
        if (status !== undefined) updates.status = status;

        updates.updated_at = new Date();

        await place.update(updates);
        return place;
    }

    async deletePlace(id) {
        const placeId = this.parsePositiveInt(id, 'id');

        const place = await db.Place.findByPk(placeId);
        if (!place) {
            const err = new Error('Place not found');
            err.statusCode = 404;
            throw err;
        }

        await place.destroy();
        return { id: placeId };
    }
}

module.exports = new PlaceController();
