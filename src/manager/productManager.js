const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const HttpError = require('../utils/httpError');
const productController = require('../controller/ProductController');

class ProductManager {
  getAll = asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search = req.query.query || '';
    const userIdFilter = req.query.userId ? Number(req.query.userId) : null;

    const { count, rows } = await productController.getAll({
      page,
      limit,
      search,
      userIdFilter
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'OK',
      data: rows,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
  });

  getDetail = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      throw new HttpError(400, 'ID sản phẩm không hợp lệ');
    }

    const product = await productController.getDetail(id);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'OK',
      data: product
    });
  });

  create = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const userRole = String(req.user?.role || '').toLowerCase();

    if (!userId) {
      throw new HttpError(401, 'Yêu cầu đăng nhập');
    }

    const { name, description, price, image_url, affiliate_url, category } = req.body;

    const newProduct = await productController.create({
      userId,
      userRole,
      name,
      description,
      price,
      image_url,
      affiliate_url,
      category
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Đăng sản phẩm thành công!',
      data: newProduct
    });
  });

  update = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const userRole = String(req.user?.role || '').toLowerCase();
    const id = Number(req.params.id);

    if (isNaN(id)) {
      throw new HttpError(400, 'ID sản phẩm không hợp lệ');
    }

    const { name, description, price, image_url, affiliate_url, category } = req.body;

    const updatedProduct = await productController.update(id, {
      userId,
      userRole,
      name,
      description,
      price,
      image_url,
      affiliate_url,
      category
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Cập nhật sản phẩm thành công!',
      data: updatedProduct
    });
  });

  delete = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const userRole = String(req.user?.role || '').toLowerCase();
    const id = Number(req.params.id);

    if (isNaN(id)) {
      throw new HttpError(400, 'ID sản phẩm không hợp lệ');
    }

    await productController.delete(id, { userId, userRole });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Xóa sản phẩm thành công!'
    });
  });
}

module.exports = new ProductManager();
