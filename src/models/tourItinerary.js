const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TourItinerary', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    tour_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tours',
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
    stop_order: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    stop_type: {
      type: DataTypes.ENUM('start','checkpoint','rest','end'),
      allowNull: false,
      defaultValue: "checkpoint"
    },
    arrival_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    note_at_stop: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tour_itineraries',
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
        name: "tour_itineraries_tour_id_idx",
        using: "BTREE",
        fields: [
          { name: "tour_id" },
        ]
      },
      {
        name: "tour_itineraries_location_id_idx",
        using: "BTREE",
        fields: [
          { name: "location_id" },
        ]
      },
    ]
  });
};
