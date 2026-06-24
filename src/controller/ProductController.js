const db = require('../models');
const { Op } = require('sequelize');

class ProductController {
  /**
   * Lấy danh sách sản phẩm (public shop / filter by business)
   */
  async getAll({ page, limit, search = '', userIdFilter = null }) {
    const offset = (page - 1) * limit;
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

    return { count, rows };
  }

  /**
   * Xem chi tiết sản phẩm
   */
  async getDetail(id) {
    const product = await db.Product.findByPk(id, {
      include: [{
        model: db.User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'avatar']
      }]
    });

    if (!product) {
      const err = new Error('Không tìm thấy sản phẩm');
      err.statusCode = 404;
      throw err;
    }

    return product;
  }

  /**
   * Tạo sản phẩm mới (chỉ Business / Admin)
   */
  async create({ userId, userRole, name, description, price, image_url, affiliate_url }) {
    if (!name || price === undefined) {
      const err = new Error('Tên và giá sản phẩm là bắt buộc');
      err.statusCode = 400;
      throw err;
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
        const err = new Error(`Bạn đã đạt giới hạn đăng sản phẩm của gói "${packageName}" (Tối đa: ${maxProducts} sản phẩm). Vui lòng nâng cấp gói.`);
        err.statusCode = 403;
        throw err;
      }
    }

    return db.Product.create({
      name,
      description,
      price,
      image_url,
      affiliate_url,
      user_id: userId
    });
  }

  /**
   * Cập nhật sản phẩm
   */
  async update(id, { userId, userRole, name, description, price, image_url, affiliate_url }) {
    const product = await db.Product.findByPk(id);
    if (!product) {
      const err = new Error('Không tìm thấy sản phẩm');
      err.statusCode = 404;
      throw err;
    }

    // Chỉ admin hoặc chính chủ mới được sửa
    if (userRole !== 'admin' && Number(product.user_id) !== Number(userId)) {
      const err = new Error('Bạn không có quyền sửa sản phẩm này');
      err.statusCode = 403;
      throw err;
    }

    await product.update({
      name: name !== undefined ? name : product.name,
      description: description !== undefined ? description : product.description,
      price: price !== undefined ? price : product.price,
      image_url: image_url !== undefined ? image_url : product.image_url,
      affiliate_url: affiliate_url !== undefined ? affiliate_url : product.affiliate_url,
      updated_at: new Date()
    });

    return product;
  }

  /**
   * Xóa sản phẩm
   */
  async delete(id, { userId, userRole }) {
    const product = await db.Product.findByPk(id);
    if (!product) {
      const err = new Error('Không tìm thấy sản phẩm');
      err.statusCode = 404;
      throw err;
    }

    // Chỉ admin hoặc chính chủ mới được xóa
    if (userRole !== 'admin' && Number(product.user_id) !== Number(userId)) {
      const err = new Error('Bạn không có quyền xóa sản phẩm này');
      err.statusCode = 403;
      throw err;
    }

    await product.destroy();
    return { success: true };
  }
}

module.exports = new ProductController();
