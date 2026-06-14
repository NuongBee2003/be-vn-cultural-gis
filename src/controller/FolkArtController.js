const db = require('../models');
const { Op } = require('sequelize');

class FolkArtController {
    async getAllFolkArts(query = {}) {
        const { search } = query;
        const whereClause = {};
        
        if (search) {
            whereClause.name = {
                [Op.like]: `%${search}%`
            };
        }
        
        return db.FolkArt.findAll({
            where: whereClause,
            order: [['created_at', 'DESC']]
        });
    }

    async getFolkArtById(id) {
        return db.FolkArt.findByPk(id);
    }

    async createFolkArt(payload) {
        const { name, description, history, instruments, image_url } = payload;
        if (!name) {
            const err = new Error('Folk art name is required');
            err.statusCode = 400;
            throw err;
        }
        return db.FolkArt.create({
            name,
            description,
            history,
            instruments,
            image_url,
            created_at: new Date()
        });
    }

    async updateFolkArt(id, payload) {
        const folkArt = await db.FolkArt.findByPk(id);
        if (!folkArt) {
            const err = new Error('Folk art not found');
            err.statusCode = 404;
            throw err;
        }
        
        const { name, description, history, instruments, image_url } = payload;
        await folkArt.update({
            name: name !== undefined ? name : folkArt.name,
            description: description !== undefined ? description : folkArt.description,
            history: history !== undefined ? history : folkArt.history,
            instruments: instruments !== undefined ? instruments : folkArt.instruments,
            image_url: image_url !== undefined ? image_url : folkArt.image_url
        });
        return folkArt;
    }

    async deleteFolkArt(id) {
        const folkArt = await db.FolkArt.findByPk(id);
        if (!folkArt) {
            const err = new Error('Folk art not found');
            err.statusCode = 404;
            throw err;
        }
        await folkArt.destroy();
        return { success: true };
    }
}

module.exports = new FolkArtController();
