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
    place_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'places',
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
        name: "assets_place_id_fkey",
        using: "BTREE",
        fields: [
          { name: "place_id" },
        ]
      },
      {
        name: "assets_post_id_fkey",
        using: "BTREE",
        fields: [
          { name: "post_id" },
        ]
      },
      {
        name: "assets_review_id_fkey",
        using: "BTREE",
        fields: [
          { name: "review_id" },
        ]
      },
    ]
  });
};
