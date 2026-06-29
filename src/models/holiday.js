const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Holiday', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    category: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "e.g., Ngày lễ quốc gia, Lễ Tết & lễ hội truyền thống"
    },
    date_label: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "e.g., 1\/1, Tết âm lịch, Rằm tháng Giêng"
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "Tên ngày lễ e.g., Tết Dương lịch, Tết Nguyên đán"
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Mô tả ngắn gọn"
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: "Đường dẫn ảnh"
    },
    history: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Lịch sử và ý nghĩa chi tiết"
    },
    activities: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Mảng chuỗi các hoạt động (JSON array of strings)"
    },

    foods: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Mảng ẩm thực (JSON array of objects: [{\"name\": \"\", \"reason\": \"\"}])"
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'holidays',
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
