const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Location', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    lat: {
      type: DataTypes.DECIMAL(10,8),
      allowNull: true
    },
    lng: {
      type: DataTypes.DECIMAL(11,8),
      allowNull: true
    },
    province_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'provinces',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending','accepted','rejected'),
      allowNull: false,
      defaultValue: "pending"
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    place_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'places',
        key: 'id'
      }
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'locations',
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
        name: "idx_locations_coords",
        using: "BTREE",
        fields: [
          { name: "lat" },
          { name: "lng" },
        ]
      },
      {
        name: "locations_province_id_idx",
        using: "BTREE",
        fields: [
          { name: "province_id" },
        ]
      },
      {
        name: "locations_place_id_idx",
        using: "BTREE",
        fields: [
          { name: "place_id" },
        ]
      },
    ]
  });
};
