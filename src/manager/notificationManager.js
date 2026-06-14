const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const HttpError = require('../utils/httpError');
const notificationController = require('../controller/NotificationController');

class NotificationManager {
    getByUser = asyncHandler(async (req, res) => {
        const userId = req.userId;
        if (!userId) {
            throw new HttpError(401, 'Authentication required');
        }
        const notifications = await notificationController.getNotificationsByUser(userId);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: notifications,
        });
    });

    markRead = asyncHandler(async (req, res) => {
        const userId = req.userId;
        if (!userId) {
            throw new HttpError(401, 'Authentication required');
        }
        const notiId = Number(req.params.id);
        if (isNaN(notiId)) {
            throw new HttpError(400, 'Invalid notification ID');
        }
        const updated = await notificationController.markAsRead(notiId, userId);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Notification marked as read',
            data: updated,
        });
    });

    markAllRead = asyncHandler(async (req, res) => {
        const userId = req.userId;
        if (!userId) {
            throw new HttpError(401, 'Authentication required');
        }
        const result = await notificationController.markAllAsRead(userId);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'All notifications marked as read',
            data: result,
        });
    });
}

module.exports = new NotificationManager();
