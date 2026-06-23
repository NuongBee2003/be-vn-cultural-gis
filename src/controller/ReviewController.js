const db = require('../models');

class ReviewController {
    /**
     * Get all reviews with user, location, place, and category details
     * Also calculates the count of food reviews vs tourist reviews
     */
    async getAllReviewsAdmin({ page = 1, limit = 20, query = '' }) {
        const offset = (page - 1) * limit;

        // Xây dựng điều kiện tìm kiếm nếu có
        let whereCondition = {};
        if (query) {
            whereCondition.comment = {
                [db.Sequelize.Op.like]: `%${query}%`
            };
        }

        const result = await db.Review.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['id', 'username', 'email', 'avatar']
                },
                {
                    model: db.Location,
                    as: 'location',
                    include: [
                        {
                            model: db.Place,
                            as: 'place',
                            include: [
                                {
                                    model: db.Category,
                                    as: 'category'
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset,
            distinct: true
        });

        // Tính tổng theo category để thống kê (cần query riêng không phân trang)
        const allReviews = await db.Review.findAll({
            include: [
                {
                    model: db.Location,
                    as: 'location',
                    attributes: ['id'],
                    include: [
                        {
                            model: db.Place,
                            as: 'place',
                            attributes: ['id'],
                            include: [
                                {
                                    model: db.Category,
                                    as: 'category',
                                    attributes: ['name']
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        let categoryStatsMap = {};

        allReviews.forEach(r => {
            const catName = r.location?.place?.category?.name || 'Chưa phân loại';
            const ratingValue = Number(r.rating) || 0;
            if (categoryStatsMap[catName]) {
                categoryStatsMap[catName].sum += ratingValue;
                categoryStatsMap[catName].count += 1;
            } else {
                categoryStatsMap[catName] = {
                    sum: ratingValue,
                    count: 1
                };
            }
        });

        // Convert to array
        const categoryStats = Object.keys(categoryStatsMap).map(name => {
            const avgRating = categoryStatsMap[name].sum / categoryStatsMap[name].count;
            return {
                name,
                count: categoryStatsMap[name].count,
                averageRating: Number(avgRating.toFixed(1))
            };
        });

        // Sort by count descending
        categoryStats.sort((a, b) => b.count - a.count);

        return {
            rows: result.rows,
            count: result.count,
            categoryStats,
            page,
            limit
        };
    }
}

module.exports = new ReviewController();
