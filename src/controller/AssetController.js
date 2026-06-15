const db = require('../models');

const Asset = db.Asset;

// Các owner field hợp lệ của bảng assets
const VALID_OWNER_FIELDS = ['location_id', 'post_id', 'review_id'];

class AssetController {
    /**
     * Thêm nhiều ảnh. images là mảng string URL.
     * owner là object chứa đúng 1 trong các key: { location_id }, { post_id }, { review_id }
     * Các field còn lại mặc định null trong DB.
     * Ảnh đầu tiên sẽ được đánh dấu is_primary = 1.
     *
     * @example
     * createAssets(["url1", "url2"], { location_id: 5 }, opts)
     * createAssets(["url1"], { post_id: 12 }, opts)
     * createAssets(["url1"], { review_id: 8 }, opts)
     */
    async createAssets(images, owner, options = {}) {
        const { transaction } = options;
        if (!Array.isArray(images) || images.length === 0) return [];

        const records = images.map((url, index) => ({
            url,
            is_primary: index === 0 ? 1 : 0,
            location_id: owner.location_id ?? null,
            post_id: owner.post_id ?? null,
            review_id: owner.review_id ?? null,
        }));

        return Asset.bulkCreate(records, transaction ? { transaction } : undefined);
    }

    /**
     * Xóa ảnh theo owner field.
     * @example
     * deleteAssets({ location_id: 5 }, opts)
     * deleteAssets({ post_id: 12 }, opts)
     */
    async deleteAssets(owner, options = {}) {
        const { transaction } = options;
        const where = {
            location_id: owner.location_id ?? null,
            post_id: owner.post_id ?? null,
            review_id: owner.review_id ?? null,
        };
        return Asset.destroy({
            where,
            ...(transaction ? { transaction } : {}),
        });
    }

    /**
     * Thay thế ảnh: xóa cũ → thêm mới.
     * Nếu images rỗng thì chỉ xóa.
     */
    async replaceAssets(images, owner, options = {}) {
        await this.deleteAssets(owner, options);
        return this.createAssets(images, owner, options);
    }

    /**
     * Lấy danh sách ảnh theo owner field.
     */
    async getAssets(owner) {
        return Asset.findAll({
            attributes: ['id', 'url', 'is_primary'],
            where: {
                location_id: owner.location_id ?? null,
                post_id: owner.post_id ?? null,
                review_id: owner.review_id ?? null,
            },
            order: [['is_primary', 'DESC'], ['id', 'ASC']],
        });
    }
}

module.exports = new AssetController();
