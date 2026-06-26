const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FolkArt', {
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
    history: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Lịch sử hình thành"
    },
    instruments: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Nhạc cụ\/đạo cụ đặc trưng"
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE(3),
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP(3)')
    },
    updated_at: {
      type: DataTypes.DATE(3),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'folk_arts',
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
    ]
  });
};
