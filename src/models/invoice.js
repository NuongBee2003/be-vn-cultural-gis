const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Invoice', {
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
    subscription_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user_subscriptions',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    payment_gateway: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'vnpay'
    },
    transaction_no: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    bank_code: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    card_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    order_info: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending'
    },
    payment_date: {
      type: DataTypes.DATE(3),
      allowNull: true
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
    tableName: 'invoices',
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
        name: "subscription_id",
        using: "BTREE",
        fields: [
          { name: "subscription_id" },
        ]
      }
    ]
  });
};
