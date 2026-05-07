const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Place', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending','accepted','rejected'),
      allowNull: false,
      defaultValue: "pending"
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    created_at: {
      type: DataTypes.DATE(3),
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)')
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'places',
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
        name: "places_category_id_idx",
        using: "BTREE",
        fields: [
          { name: "category_id" },
        ]
      },
      {
        name: "places_created_by_idx",
        using: "BTREE",
        fields: [
          { name: "created_by" },
        ]
      },
    ]
  });
};
