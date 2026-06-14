const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('CuisinePlace', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    cuisine_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'cuisines',
        key: 'id'
      }
    },
    place_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'places',
        key: 'id'
      }
    },
    notes: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Ghi chú về địa điểm này (ví dụ: giờ bán, chất lượng)"
    },
    created_at: {
      type: DataTypes.DATE(3),
      allowNull: false,
      defaultValue: "CURRENT_TIMESTAMP(3)"
    }
  }, {
    sequelize,
    tableName: 'cuisine_places',
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
        name: "idx_cuisine_places_cuisine_id",
        using: "BTREE",
        fields: [
          { name: "cuisine_id" },
        ]
      },
      {
        name: "idx_cuisine_places_place_id",
        using: "BTREE",
        fields: [
          { name: "place_id" },
        ]
      },
    ]
  });
};
