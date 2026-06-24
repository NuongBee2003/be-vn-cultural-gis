const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const permissionController = require('../controller/PermissionController');

class PermissionManager {
    getAllPermissions = asyncHandler(async (req, res) => {
        const permissions = await permissionController.getAllPermissions();
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy danh sách permission thành công',
            data: permissions
        });
    });
}

module.exports = new PermissionManager();
