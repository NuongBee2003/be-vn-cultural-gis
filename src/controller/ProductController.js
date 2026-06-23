const db = require('../models');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { Op } = require('sequelize');

class ProductController {
  /**
   * GET /api/v1/product
   * Lấy danh sách sản phẩm (public shop / filter by business)
   */
  async getAll(req, res) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const offset = (page - 1) * limit;
      const search = req.query.query || '';
      const userIdFilter = req.query.userId ? Number(req.query.userId) : null;

      const where = {};
      if (userIdFilter) {
        where.user_id = userIdFilter;
      }
      if (search) {
        where.name = { [Op.like]: `%${search}%` };
      }

      const { count, rows } = await db.Product.findAndCountAll({
        where,
        include: [{
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'avatar']
        }],
        order: [['created_at', 'DESC']],
        limit,
        offset,
        distinct: true
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
    } catch (error) {
      console.error('Lỗi khi lấy danh sách sản phẩm:', error);
      return sendError(res, 500, 'Lỗi hệ thống');
    }
  }

  /**
   * GET /api/v1/product/:id
   * Xem chi tiết sản phẩm
   */
  async getDetail(req, res) {
    try {
      const { id } = req.params;
      const product = await db.Product.findByPk(id, {
        include: [{
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'avatar']
        }]
      });

      if (!product) {
        return sendError(res, 404, 'Không tìm thấy sản phẩm');
      }

      return sendSuccess(res, {
        statusCode: 200,
        message: 'OK',
        data: product
      });
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
      return sendError(res, 500, 'Lỗi hệ thống');
    }
  }

  /**
   * POST /api/v1/product
   * Tạo sản phẩm mới (chỉ Business / Admin)
   */
  async create(req, res) {
    try {
      const userId = req.userId;
      const userRole = String(req.user?.role || '').toLowerCase();

      if (!userId) {
        return sendError(res, 401, 'Yêu cầu đăng nhập');
      }

      const { name, description, price, image_url, affiliate_url } = req.body;
      if (!name || price === undefined) {
        return sendError(res, 400, 'Tên và giá sản phẩm là bắt buộc');
      }

      // Kiểm tra gói giới hạn cho Business (trừ Admin)
      if (userRole !== 'admin') {
        const now = new Date();
        const activeSub = await db.UserSubscription.findOne({
          where: {
            user_id: userId,
            status: 'active',
            [Op.or]: [
              { end_date: null },
              { end_date: { [Op.gt]: now } }
            ]
          },
          include: [{ model: db.Package, as: 'package' }],
          order: [['created_at', 'DESC']]
        });

        let maxProducts = 3; // Free limit default
        let packageName = 'Free';

        if (activeSub && activeSub.package) {
          maxProducts = activeSub.package.max_products !== undefined ? activeSub.package.max_products : 3;
          packageName = activeSub.package.name;
        } else {
          // Lấy thông tin từ gói mặc định trong DB
          const freePkg = await db.Package.findOne({
            where: { price: 0.00 },
            order: [['max_products', 'ASC']]
          });
          if (freePkg) {
            maxProducts = freePkg.max_products !== undefined ? freePkg.max_products : 3;
            packageName = freePkg.name;
          }
        }

        const currentCount = await db.Product.count({ where: { user_id: userId } });
        if (currentCount >= maxProducts) {
          return sendError(res, 403, `Bạn đã đạt giới hạn đăng sản phẩm của gói "${packageName}" (Tối đa: ${maxProducts} sản phẩm). Vui lòng nâng cấp gói.`);
        }
      }

      const newProduct = await db.Product.create({
        name,
        description,
        price,
        image_url,
        affiliate_url,
        user_id: userId
      });

      return sendSuccess(res, {
        statusCode: 201,
        message: 'Đăng sản phẩm thành công!',
        data: newProduct
      });
    } catch (error) {
      console.error('Lỗi khi tạo sản phẩm:', error);
      return sendError(res, 500, 'Lỗi hệ thống');
    }
  }

  /**
   * PUT /api/v1/product/:id
   * Cập nhật sản phẩm
   */
  async update(req, res) {
    try {
      const userId = req.userId;
      const userRole = String(req.user?.role || '').toLowerCase();
      const { id } = req.params;

      const product = await db.Product.findByPk(id);
      if (!product) {
        return sendError(res, 404, 'Không tìm thấy sản phẩm');
      }

      // Chỉ admin hoặc chính chủ mới được sửa
      if (userRole !== 'admin' && Number(product.user_id) !== Number(userId)) {
        return sendError(res, 403, 'Bạn không có quyền sửa sản phẩm này');
      }

      const { name, description, price, image_url, affiliate_url } = req.body;
      
      await product.update({
        name: name !== undefined ? name : product.name,
        description: description !== undefined ? description : product.description,
        price: price !== undefined ? price : product.price,
        image_url: image_url !== undefined ? image_url : product.image_url,
        affiliate_url: affiliate_url !== undefined ? affiliate_url : product.affiliate_url,
        updated_at: new Date()
      });

      return sendSuccess(res, {
        statusCode: 200,
        message: 'Cập nhật sản phẩm thành công!',
        data: product
      });
    } catch (error) {
      console.error('Lỗi khi cập nhật sản phẩm:', error);
      return sendError(res, 500, 'Lỗi hệ thống');
    }
  }

  /**
   * DELETE /api/v1/product/:id
   * Xóa sản phẩm
   */
  async delete(req, res) {
    try {
      const userId = req.userId;
      const userRole = String(req.user?.role || '').toLowerCase();
      const { id } = req.params;

      const product = await db.Product.findByPk(id);
      if (!product) {
        return sendError(res, 404, 'Không tìm thấy sản phẩm');
      }

      // Chỉ admin hoặc chính chủ mới được xóa
      if (userRole !== 'admin' && Number(product.user_id) !== Number(userId)) {
        return sendError(res, 403, 'Bạn không có quyền xóa sản phẩm này');
      }

      await product.destroy();

      return sendSuccess(res, {
        statusCode: 200,
        message: 'Xóa sản phẩm thành công!'
      });
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm:', error);
      return sendError(res, 500, 'Lỗi hệ thống');
    }
  }
}

module.exports = new ProductController();
