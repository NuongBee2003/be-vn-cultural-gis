const categoryController = require('../controller/CategoryController');

class CategoryManager {
    async getAllCategories(req, res) {
        try {
            const categories = await categoryController.getAllCategories();
            return res.status(200).json(categories);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.log('ERROR: ' + error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async create(req, res) {
        try {
            const category = await categoryController.createCategory(req.body);
            return res.status(201).json(category);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.log('ERROR: ' + error);
            const statusCode = error?.statusCode;
            if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
                return res.status(statusCode).json({ message: error.message });
            }
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async update(req, res) {
        try {
            const category = await categoryController.updateCategory(req.params.id, req.body);
            return res.status(200).json(category);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.log('ERROR: ' + error);
            const statusCode = error?.statusCode;
            if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
                return res.status(statusCode).json({ message: error.message });
            }
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async delete(req, res) {
        try {
            await categoryController.deleteCategory(req.params.id);
            return res.status(200).json({ message: 'Category deleted successfully' });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.log('ERROR: ' + error);
            const statusCode = error?.statusCode;
            if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
                return res.status(statusCode).json({ message: error.message });
            }
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = new CategoryManager();
