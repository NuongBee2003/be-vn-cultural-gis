const db = require('../models');
const { Op } = require('sequelize');

class CuisineController {
    async getAllCuisines(query = {}) {
        const { search } = query;
        const whereClause = {};
        
        if (search) {
            whereClause.name = {
                [Op.like]: `%${search}%`
            };
        }
        
        return db.Cuisine.findAll({
            where: whereClause,
            include: [
                {
                    model: db.CuisinePlace,
                    as: 'cuisine_places',
                    include: [
                        {
                            model: db.Place,
                            as: 'place',
                            include: [
                                {
                                    model: db.Location,
                                    as: 'locations'
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    async getCuisineById(id) {
        return db.Cuisine.findByPk(id, {
            include: [
                {
                    model: db.CuisinePlace,
                    as: 'cuisine_places',
                    include: [
                        {
                            model: db.Place,
                            as: 'place',
                            include: [
                                {
                                    model: db.Location,
                                    as: 'locations'
                                }
                            ]
                        }
                    ]
                }
            ]
        });
    }

    async createCuisine(payload) {
        const { name, description, origin, ingredients, image_url, place_ids } = payload;
        if (!name) {
            const err = new Error('Cuisine name is required');
            err.statusCode = 400;
            throw err;
        }
        const cuisine = await db.Cuisine.create({
            name,
            description,
            origin,
            ingredients,
            image_url,
            created_at: new Date()
        });

        if (place_ids && place_ids.length > 0) {
            const bulkData = place_ids.map(pId => ({
                cuisine_id: cuisine.id,
                place_id: pId,
                created_at: new Date()
            }));
            await db.CuisinePlace.bulkCreate(bulkData);
        }

        return cuisine;
    }

    async updateCuisine(id, payload) {
        const cuisine = await db.Cuisine.findByPk(id);
        if (!cuisine) {
            const err = new Error('Cuisine not found');
            err.statusCode = 404;
            throw err;
        }
        
        const { name, description, origin, ingredients, image_url, place_ids } = payload;
        await cuisine.update({
            name: name !== undefined ? name : cuisine.name,
            description: description !== undefined ? description : cuisine.description,
            origin: origin !== undefined ? origin : cuisine.origin,
            ingredients: ingredients !== undefined ? ingredients : cuisine.ingredients,
            image_url: image_url !== undefined ? image_url : cuisine.image_url
        });

        if (place_ids !== undefined) {
            await db.CuisinePlace.destroy({
                where: { cuisine_id: id }
            });
            if (place_ids.length > 0) {
                const bulkData = place_ids.map(pId => ({
                    cuisine_id: id,
                    place_id: pId,
                    created_at: new Date()
                }));
                await db.CuisinePlace.bulkCreate(bulkData);
            }
        }
        
        return cuisine;
    }

    async deleteCuisine(id) {
        const cuisine = await db.Cuisine.findByPk(id);
        if (!cuisine) {
            const err = new Error('Cuisine not found');
            err.statusCode = 404;
            throw err;
        }
        await cuisine.destroy();
        return { success: true };
    }

    async addRecommendation(cuisineId, placeId, notes) {
        const [cuisine, place] = await Promise.all([
            db.Cuisine.findByPk(cuisineId),
            db.Place.findByPk(placeId)
        ]);

        if (!cuisine) {
            const err = new Error('Cuisine not found');
            err.statusCode = 404;
            throw err;
        }
        if (!place) {
            const err = new Error('Place not found');
            err.statusCode = 404;
            throw err;
        }

        return db.CuisinePlace.create({
            cuisine_id: cuisineId,
            place_id: placeId,
            notes,
            created_at: new Date()
        });
    }

    async removeRecommendation(id) {
        const rec = await db.CuisinePlace.findByPk(id);
        if (!rec) {
            const err = new Error('Recommendation link not found');
            err.statusCode = 404;
            throw err;
        }
        await rec.destroy();
        return { success: true };
    }
}

module.exports = new CuisineController();
