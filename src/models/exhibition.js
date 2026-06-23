const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Exhibition', {
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('place','food','festival'),
      allowNull: false
    },
    style_tag: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    place_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    province: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    likes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('pending','accepted','rejected'),
      allowNull: true,
      defaultValue: "pending"
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
    tableName: 'exhibitions',
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
        name: "fk_exhibitions_user",
        using: "BTREE",
        fields: [
          { name: "user_id" },
        ]
      },
    ]
  });
};
