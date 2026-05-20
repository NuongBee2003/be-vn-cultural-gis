const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Location', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    place_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'places',
        key: 'id'
      }
    },
    district_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'districts',
        key: 'id'
      }
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    lat: {
      type: DataTypes.DECIMAL(10,8),
      allowNull: true
    },
    lng: {
      type: DataTypes.DECIMAL(11,8),
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
        name: "locations_place_id_fkey",
        using: "BTREE",
        fields: [
          { name: "place_id" },
        ]
      },
      {
        name: "locations_district_id_fkey",
        using: "BTREE",
        fields: [
          { name: "district_id" },
        ]
      },
    ]
  });
};
