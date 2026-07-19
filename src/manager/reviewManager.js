const reviewController = require('../controller/ReviewController');
const { sendSuccess } = require('../utils/apiResponse');
const db = require('../models');

class ReviewManager {
    async getAllReviewsAdmin(req, res) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 20;
            const query = req.query.query || '';

            const result = await reviewController.getAllReviewsAdmin({ page, limit, query });
            const totalPages = Math.ceil(result.count / result.limit);

            return sendSuccess(res, {
                statusCode: 200,
                message: 'OK',
                data: {
                    reviews: result.rows,
                    stats: {
                        categoryStats: result.categoryStats
                    }
                },
                meta: {
                    total: result.count,
                    count: result.rows.length,
                    page: result.page,
                    limit: result.limit,
                    totalPages: totalPages,
                },
            });
        } catch (error) {
            console.log('ERROR: ' + error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async toggleLike(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            const reviewId = Number(req.params.id);
            if (!Number.isInteger(reviewId) || reviewId <= 0) {
                return res.status(400).json({ message: 'id phải là số nguyên dương' });
            }

            // Kiểm tra review tồn tại
            const review = await db.Review.findByPk(reviewId);
            if (!review) {
                return res.status(404).json({ message: 'Review not found' });
            }

            const existing = await db.ReviewLike.findOne({
                where: { review_id: reviewId, user_id: userId },
            });

            let likedYN;
            if (existing) {
                await db.ReviewLike.destroy({
                    where: { review_id: reviewId, user_id: userId }
                });
                likedYN = 'N';
            } else {
                await db.ReviewLike.create({
                    review_id: reviewId,
                    user_id: userId,
                    created_at: new Date()
                });
                likedYN = 'Y';
            }

            const likeCount = await db.ReviewLike.count({ where: { review_id: reviewId } });

            return sendSuccess(res, {
                statusCode: 200,
                message: likedYN === 'Y' ? 'Liked' : 'Unliked',
                data: { review_id: reviewId, likedYN, likeCount },
            });
        } catch (error) {
            console.log('ERROR: ' + error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = new ReviewManager();
