const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('UserSubscription', {
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
    package_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'packages',
        key: 'id'
      }
    },
    start_date: {
      type: DataTypes.DATE(3),
      allowNull: true,
      defaultValue: "CURRENT_TIMESTAMP(3)"
    },
    end_date: {
      type: DataTypes.DATE(3),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending','active','expired','cancelled'),
      allowNull: false,
      defaultValue: "active"
    },
    created_at: {
      type: DataTypes.DATE(3),
      allowNull: true,
      defaultValue: "CURRENT_TIMESTAMP(3)"
    },
    updated_at: {
      type: DataTypes.DATE(3),
      allowNull: true,
      defaultValue: "CURRENT_TIMESTAMP(3)"
    }
  }, {
    sequelize,
    tableName: 'user_subscriptions',
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
        name: "user_id",
        using: "BTREE",
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "package_id",
        using: "BTREE",
        fields: [
          { name: "package_id" },
        ]
      },
    ]
  });
};
