const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Notification', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    actor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    post_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'posts',
        key: 'id'
      }
    },
    comment_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'comments',
        key: 'id'
      }
    },
    url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    message: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0
    },
    created_at: {
      type: DataTypes.DATE(3),
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)')
    }
  }, {
    sequelize,
    tableName: 'notifications',
    timestamps: false,
    hooks: {
      afterCreate: async (notification, options) => {
        try {
          const { sendNotificationToUser } = require('../services/websocket');
          const fullNotification = await sequelize.models.Notification.findByPk(notification.id, {
            include: [
              {
                model: sequelize.models.User,
                as: 'actor',
                attributes: ['id', 'username', 'avatar']
              },
              {
                model: sequelize.models.Post,
                as: 'post',
                attributes: ['id', 'title']
              },
              {
                model: sequelize.models.Comment,
                as: 'comment',
                attributes: ['id', 'content']
              }
            ]
          });
          if (fullNotification) {
            sendNotificationToUser(fullNotification.user_id, fullNotification);
          }
        } catch (err) {
          console.error('Error in Notification afterCreate hook:', err);
        }
      }
    },
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "post_id",
        using: "BTREE",
        fields: [
          { name: "post_id" },
        ]
      },
      {
        name: "comment_id",
        using: "BTREE",
        fields: [
          { name: "comment_id" },
        ]
      },
      {
        name: "notifications_user_id_idx",
        using: "BTREE",
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "notifications_actor_id_idx",
        using: "BTREE",
        fields: [
          { name: "actor_id" },
        ]
      },
    ]
  });
};
