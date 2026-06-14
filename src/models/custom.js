const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Custom', {
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
    time_period: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Thời gian diễn ra lễ hội\/phong tục"
    },
    rituals: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Các nghi lễ, hoạt động chính"
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE(3),
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)')
    },
    updated_at: {
      type: DataTypes.DATE(3),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'customs',
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
