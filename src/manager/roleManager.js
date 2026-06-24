const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const roleController = require('../controller/RoleController');

class RoleManager {
    getAllRoles = asyncHandler(async (req, res) => {
        const roles = await roleController.getAllRoles();
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy danh sách role thành công',
            data: roles
        });
    });

    getRoleById = asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        const role = await roleController.getRoleById(id);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy chi tiết role thành công',
            data: role
        });
    });

    createRole = asyncHandler(async (req, res) => {
        const { name, description, permissionIds } = req.body;
        const newRole = await roleController.createRole({ name, description, permissionIds });
        return sendSuccess(res, {
            statusCode: 201,
            message: 'Tạo role thành công',
            data: newRole
        });
    });

    updateRole = asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        const { name, description, permissionIds } = req.body;
        const updatedRole = await roleController.updateRole(id, { name, description, permissionIds });
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Cập nhật role thành công',
            data: updatedRole
        });
    });

    deleteRole = asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        await roleController.deleteRole(id);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Xóa role thành công'
        });
    });
}

module.exports = new RoleManager();
