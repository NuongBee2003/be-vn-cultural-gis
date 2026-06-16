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
        const { name, icon_marker, color } = payload || {};
        if (!name || typeof name !== 'string') {
            const err = new Error('name is required');
            err.statusCode = 400;
            throw err;
        }
        return db.Category.create({ name, icon_marker, color });
    }

    async updateCategory(id, payload) {
        const categoryId = this.parsePositiveInt(id, 'id');
        const { name, icon_marker, color } = payload || {};

        const category = await db.Category.findByPk(categoryId);
        if (!category) {
            const err = new Error('Category not found');
            err.statusCode = 404;
            throw err;
        }

        if (name !== undefined) category.name = name;
        if (icon_marker !== undefined) category.icon_marker = icon_marker;
        if (color !== undefined) category.color = color;
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

        // Kiểm tra xem có địa điểm nào thuộc danh mục này không
        const associatedPlacesCount = await db.Place.count({
            where: { category_id: categoryId }
        });

        if (associatedPlacesCount > 0) {
            const err = new Error('Không thể xóa danh mục này vì đang có địa điểm thuộc danh mục');
            err.statusCode = 400;
            throw err;
        }

        await category.destroy();
        return true;
    }
}

module.exports = new CategoryController();
