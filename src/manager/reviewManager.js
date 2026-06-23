const reviewController = require('../controller/ReviewController');
const { sendSuccess } = require('../utils/apiResponse');

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
}

module.exports = new ReviewManager();
