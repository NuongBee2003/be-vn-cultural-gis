const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('User', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "users_email_key"
    },
    password_hash: {
      type: DataTypes.STRING(191),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin','user','business'),
      allowNull: false,
      defaultValue: "user"
    },
    status: {
      type: DataTypes.ENUM('active','banned'),
      allowNull: false,
      defaultValue: "active"
    },
    avatar: {
      type: DataTypes.STRING(191),
      allowNull: true
    },
    business_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    business_phone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE(3),
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP(3)')
    }
  }, {
    sequelize,
    tableName: 'users',
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
        name: "users_email_key",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "email" },
        ]
      },
    ]
  });
};
