const db = require('../models');
const HttpError = require('../utils/httpError');

const Exhibition = db.Exhibition;

class ExhibitionController {
    parsePositiveInt(value, fieldName) {
        const parsed = Number(value);
        if (Number.isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
            throw new HttpError(400, `${fieldName} phải là một số nguyên dương`);
        }
        return parsed;
    }

    normalizeText(value, fieldName, required = true) {
        if (value === undefined || value === null) {
            if (required) {
                throw new HttpError(400, `${fieldName} không được để trống`);
            }
            return null;
        }

        if (typeof value !== 'string') {
            throw new HttpError(400, `${fieldName} phải là chuỗi`);
        }

        const trimmed = value.trim();
        if (required && !trimmed) {
            throw new HttpError(400, `${fieldName} không được để trống`);
        }

        return trimmed || null;
    }

    isOwnerOrAdmin(record, user) {
        if (!record || !user) return false;
        const role = String(user.role || '').toUpperCase();
        const currentUserId = Number(user.userId || user.id);
        return role === 'ADMIN' || currentUserId === Number(record.user_id);
    }

    _buildInclude() {
        return [
            {
                model: db.User,
                as: 'user',
                attributes: ['id', 'username', 'avatar'],
                required: false,
            }
        ];
    }

    async getExhibitionById(id) {
        return Exhibition.findByPk(id, {
            include: this._buildInclude(),
        });
    }

    async getAllExhibitions(user, queryParams = {}) {
        const currentUserId = user ? Number(user.userId || user.id) : null;
        const whereClause = {};

        // Phân quyền hiển thị: User thường chỉ thấy bài 'accepted' HOẶC bài của chính mình
        const orConditions = [{ status: 'accepted' }];
        if (currentUserId) {
            orConditions.push({ user_id: currentUserId });
        }
        whereClause[db.Sequelize.Op.or] = orConditions;

        // Lọc theo category
        if (queryParams.category) {
            const cat = this.normalizeText(queryParams.category, 'category', false);
            if (cat) {
                whereClause.category = cat;
            }
        }

        // Lọc theo province
        if (queryParams.province) {
            const prov = this.normalizeText(queryParams.province, 'province', false);
            if (prov) {
                whereClause.province = prov;
            }
        }

        return Exhibition.findAll({
            where: whereClause,
            order: [['created_at', 'DESC']],
            include: this._buildInclude(),
        });
    }

    async getAllExhibitionsAdmin(queryParams = {}) {
        const whereClause = {};

        if (queryParams.status) {
            whereClause.status = queryParams.status;
        }

        if (queryParams.category) {
            whereClause.category = queryParams.category;
        }

        return Exhibition.findAll({
            where: whereClause,
            order: [['created_at', 'DESC']],
            include: this._buildInclude(),
        });
    }

    async createExhibition(payload, userIdInput, user) {
        const userId = this.parsePositiveInt(userIdInput, 'user_id');
        const title = this.normalizeText(payload?.title, 'title');
        const description = this.normalizeText(payload?.description, 'description');
        const imageUrl = this.normalizeText(payload?.image_url || payload?.imageUrl, 'image_url');
        const category = this.normalizeText(payload?.category, 'category');
        const styleTag = this.normalizeText(payload?.style_tag || payload?.styleTag, 'style_tag', false);
        const placeName = this.normalizeText(payload?.place_name || payload?.placeName, 'place_name', false);
        const province = this.normalizeText(payload?.province, 'province');

        if (!['place', 'food', 'festival'].includes(category)) {
            throw new HttpError(400, "category phải là 'place', 'food' hoặc 'festival'");
        }

        const isAdmin = user && String(user.role || '').toLowerCase() === 'admin';
        // Enforce 'pending' for normal users, Admin can set status directly
        const status = isAdmin ? (payload?.status || 'accepted') : 'pending';

        const exhibition = await Exhibition.create({
            user_id: userId,
            title,
            description,
            image_url: imageUrl,
            category,
            style_tag: styleTag,
            place_name: placeName,
            province,
            status,
            likes: 0
        });

        return this.getExhibitionById(exhibition.id);
    }

    async updateExhibition(exhibition, payload, user) {
        const updates = {};

        if (payload?.title !== undefined) {
            updates.title = this.normalizeText(payload.title, 'title');
        }

        if (payload?.description !== undefined) {
            updates.description = this.normalizeText(payload.description, 'description');
        }

        if (payload?.image_url !== undefined || payload?.imageUrl !== undefined) {
            updates.image_url = this.normalizeText(payload.image_url || payload.imageUrl, 'image_url');
        }

        if (payload?.category !== undefined) {
            const category = this.normalizeText(payload.category, 'category');
            if (!['place', 'food', 'festival'].includes(category)) {
                throw new HttpError(400, "category phải là 'place', 'food' hoặc 'festival'");
            }
            updates.category = category;
        }

        if (payload?.style_tag !== undefined || payload?.styleTag !== undefined) {
            updates.style_tag = this.normalizeText(payload.style_tag || payload.styleTag, 'style_tag', false);
        }

        if (payload?.place_name !== undefined || payload?.placeName !== undefined) {
            updates.place_name = this.normalizeText(payload.place_name || payload.placeName, 'place_name', false);
        }

        if (payload?.province !== undefined) {
            updates.province = this.normalizeText(payload.province, 'province');
        }

        const isAdmin = user && String(user.role || '').toLowerCase() === 'admin';
        if (isAdmin) {
            if (payload?.status !== undefined) {
                const statusVal = this.normalizeText(payload.status, 'status');
                if (!['pending', 'accepted', 'rejected'].includes(statusVal)) {
                    throw new HttpError(400, "status phải là 'pending', 'accepted' hoặc 'rejected'");
                }
                updates.status = statusVal;
            }
        } else {
            // User sửa bài thì ép trạng thái về pending để duyệt lại
            updates.status = 'pending';
        }

        await exhibition.update(updates);
        return this.getExhibitionById(exhibition.id);
    }

    async deleteExhibition(exhibition) {
        await exhibition.destroy();
        return { id: exhibition.id };
    }

    async toggleLike(id, action) {
        const exhibitionId = this.parsePositiveInt(id, 'id');
        const exhibition = await Exhibition.findByPk(exhibitionId);

        if (!exhibition) {
            throw new HttpError(404, 'Exhibition not found');
        }

        if (action === 'like') {
            exhibition.likes = (exhibition.likes || 0) + 1;
        } else if (action === 'unlike') {
            exhibition.likes = Math.max(0, (exhibition.likes || 0) - 1);
        } else {
            throw new HttpError(400, "action phải là 'like' hoặc 'unlike'");
        }

        await exhibition.save();
        return exhibition;
    }
}

module.exports = new ExhibitionController();
