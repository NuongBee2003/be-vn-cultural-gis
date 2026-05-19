const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('WishlistDetail', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    wishlist_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'wishlists',
        key: 'id'
      }
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'locations',
        key: 'id'
      }
    },
    added_at: {
      type: DataTypes.DATE(3),
      allowNull: false,
       defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)')
    }
  }, {
    sequelize,
    tableName: 'wishlist_details',
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
        name: "wishlist_details_wishlist_id_location_id_key",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "wishlist_id" },
          { name: "location_id" },
        ]
      },
      {
        name: "wishlist_details_location_id_idx",
        using: "BTREE",
        fields: [
          { name: "location_id" },
        ]
      },
    ]
  });
};
