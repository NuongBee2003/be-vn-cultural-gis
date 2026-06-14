const db = require('../models');

class NotificationController {
    async getNotificationsByUser(userId) {
        return db.Notification.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: db.User,
                    as: 'actor',
                    attributes: ['id', 'username', 'avatar']
                },
                {
                    model: db.Post,
                    as: 'post',
                    attributes: ['id', 'title']
                },
                {
                    model: db.Comment,
                    as: 'comment',
                    attributes: ['id', 'content']
                }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    async markAsRead(id, userId) {
        const notification = await db.Notification.findOne({
            where: { id, user_id: userId }
        });
        if (!notification) {
            const err = new Error('Notification not found');
            err.statusCode = 404;
            throw err;
        }
        notification.is_read = true;
        await notification.save();
        return notification;
    }

    async markAllAsRead(userId) {
        await db.Notification.update(
            { is_read: true },
            { where: { user_id: userId, is_read: false } }
        );
        return { success: true };
    }
}

module.exports = new NotificationController();
