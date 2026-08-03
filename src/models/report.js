const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Report', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'locations',
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    report_type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'resolved', 'rejected'),
      allowNull: true,
      defaultValue: 'pending'
    },
    created_at: {
      type: DataTypes.DATE(3),
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP(3)')
    },
    updated_at: {
      type: DataTypes.DATE(3),
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP(3)')
    }
  }, {
    sequelize,
    tableName: 'reports',
    timestamps: false,
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
        name: "reports_location_id_fkey",
        using: "BTREE",
        fields: [
          { name: "location_id" },
        ]
      },
      {
        name: "reports_comment_id_fkey",
        using: "BTREE",
        fields: [
          { name: "comment_id" },
        ]
      },
      {
        name: "reports_user_id_fkey",
        using: "BTREE",
        fields: [
          { name: "user_id" },
        ]
      },
    ]
  });
};
