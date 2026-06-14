const db = require('../models');
const { Op } = require('sequelize');

class CustomController {
    async getAllCustoms(query = {}) {
        const { search } = query;
        const whereClause = {};
        
        if (search) {
            whereClause.name = {
                [Op.like]: `%${search}%`
            };
        }
        
        return db.Custom.findAll({
            where: whereClause,
            order: [['created_at', 'DESC']]
        });
    }

    async getCustomById(id) {
        return db.Custom.findByPk(id);
    }

    async createCustom(payload) {
        const { name, description, time_period, rituals, image_url } = payload;
        if (!name) {
            const err = new Error('Custom name is required');
            err.statusCode = 400;
            throw err;
        }
        return db.Custom.create({
            name,
            description,
            time_period,
            rituals,
            image_url,
            created_at: new Date()
        });
    }

    async updateCustom(id, payload) {
        const custom = await db.Custom.findByPk(id);
        if (!custom) {
            const err = new Error('Custom not found');
            err.statusCode = 404;
            throw err;
        }
        
        const { name, description, time_period, rituals, image_url } = payload;
        await custom.update({
            name: name !== undefined ? name : custom.name,
            description: description !== undefined ? description : custom.description,
            time_period: time_period !== undefined ? time_period : custom.time_period,
            rituals: rituals !== undefined ? rituals : custom.rituals,
            image_url: image_url !== undefined ? image_url : custom.image_url
        });
        return custom;
    }

    async deleteCustom(id) {
        const custom = await db.Custom.findByPk(id);
        if (!custom) {
            const err = new Error('Custom not found');
            err.statusCode = 404;
            throw err;
        }
        await custom.destroy();
        return { success: true };
    }
}

module.exports = new CustomController();
