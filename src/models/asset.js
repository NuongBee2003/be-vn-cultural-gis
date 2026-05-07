const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Asset', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0
    },
    created_at: {
      type: DataTypes.DATE(3),
      allowNull: false,
      defaultValue: "CURRENT_TIMESTAMP(3)"
    },
    place_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'places',
        key: 'id'
      }
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'locations',
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
    review_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'reviews',
        key: 'id'
      }
    },
    check_in_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'check_ins',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'assets',
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
        name: "assets_place_id_idx",
        using: "BTREE",
        fields: [
          { name: "place_id" },
        ]
      },
      {
        name: "assets_location_id_idx",
        using: "BTREE",
        fields: [
          { name: "location_id" },
        ]
      },
      {
        name: "assets_post_id_idx",
        using: "BTREE",
        fields: [
          { name: "post_id" },
        ]
      },
      {
        name: "assets_review_id_idx",
        using: "BTREE",
        fields: [
          { name: "review_id" },
        ]
      },
      {
        name: "assets_check_in_id_idx",
        using: "BTREE",
        fields: [
          { name: "check_in_id" },
        ]
      },
    ]
  });
};
