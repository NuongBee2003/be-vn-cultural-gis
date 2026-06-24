const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const HttpError = require('../utils/httpError');
const packageController = require('../controller/PackageController');

class PackageManager {
    getAllPackages = asyncHandler(async (req, res) => {
        const packages = await packageController.getAllPackages();
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy danh sách gói dịch vụ thành công',
            data: packages,
        });
    });

    getPackageById = asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            throw new HttpError(400, 'ID gói dịch vụ không hợp lệ');
        }

        const pkg = await packageController.getPackageById(id);

        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: pkg,
        });
    });

    createPackage = asyncHandler(async (req, res) => {
        const { name, description, max_places, price, duration_days } = req.body;

        const pkg = await packageController.createPackage({
            name,
            description,
            max_places,
            price,
            duration_days
        });

        return sendSuccess(res, {
            statusCode: 201,
            message: 'Tạo gói dịch vụ thành công',
            data: pkg,
        });
    });

    updatePackage = asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            throw new HttpError(400, 'ID gói dịch vụ không hợp lệ');
        }

        const { name, description, max_places, price, duration_days } = req.body;

        const pkg = await packageController.updatePackage(id, {
            name,
            description,
            max_places,
            price,
            duration_days
        });

        return sendSuccess(res, {
            statusCode: 200,
            message: 'Cập nhật gói dịch vụ thành công',
            data: pkg,
        });
    });

    deletePackage = asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            throw new HttpError(400, 'ID gói dịch vụ không hợp lệ');
        }

        await packageController.deletePackage(id);

        return sendSuccess(res, {
            statusCode: 200,
            message: 'Xóa gói dịch vụ thành công',
        });
    });
}

module.exports = new PackageManager();
