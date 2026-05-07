const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('CheckIn', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
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
    created_at: {
      type: DataTypes.DATE(3),
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)')
    }
  }, {
    sequelize,
    tableName: 'check_ins',
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
        name: "check_ins_user_id_idx",
        using: "BTREE",
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "check_ins_location_id_idx",
        using: "BTREE",
        fields: [
          { name: "location_id" },
        ]
      },
    ]
  });
};
