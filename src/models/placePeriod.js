const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('PlacePeriod', {
    place_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'places',
        key: 'id'
      }
    },
    period_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'historical_periods',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'place_periods',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "place_id" },
          { name: "period_id" },
        ]
      },
      {
        name: "place_periods_period_id_fkey",
        using: "BTREE",
        fields: [
          { name: "period_id" },
        ]
      },
    ]
  });
};
