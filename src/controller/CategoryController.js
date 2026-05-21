const db = require('../models');

class CategoryController {
    parsePositiveInt(value, fieldName) {
        const parsed = Number(value);
        if (Number.isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
            const err = new Error(`${fieldName} must be a positive integer`);
            err.statusCode = 400;
            throw err;
        }
        return parsed;
    }

    async getAllCategories() {
        return db.Category.findAll();
    }

    async createCategory(payload) {
        const { name, icon_marker } = payload || {};
        if (!name || typeof name !== 'string') {
            const err = new Error('name is required');
            err.statusCode = 400;
            throw err;
        }
        return db.Category.create({ name, icon_marker });
    }

    async updateCategory(id, payload) {
        const categoryId = this.parsePositiveInt(id, 'id');
        const { name, icon_marker } = payload || {};

        const category = await db.Category.findByPk(categoryId);
        if (!category) {
            const err = new Error('Category not found');
            err.statusCode = 404;
            throw err;
        }

        if (name !== undefined) category.name = name;
        if (icon_marker !== undefined) category.icon_marker = icon_marker;
        await category.save();
        return category;
    }

    async deleteCategory(id) {
        const categoryId = this.parsePositiveInt(id, 'id');
        const category = await db.Category.findByPk(categoryId);
        if (!category) {
            const err = new Error('Category not found');
            err.statusCode = 404;
            throw err;
        }
        await category.destroy();
        return true;
    }
}

module.exports = new CategoryController();
