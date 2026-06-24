const db = require('../models');

class PermissionController {
    /**
     * Liệt kê tất cả các permission có trong hệ thống
     */
    async getAllPermissions() {
        return db.Permission.findAll({
            order: [['name', 'ASC']]
        });
    }
}

module.exports = new PermissionController();
