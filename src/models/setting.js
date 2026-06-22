const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Setting', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    setting_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Mã cài đặt duy nhất (VD: APP_NAME, MAINTAIN_MODE)",
      unique: "setting_key"
    },
    setting_value: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Giá trị cấu hình (Có thể lưu chuỗi hoặc JSON)"
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Mô tả chức năng cài đặt"
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 1,
      comment: "Trạng thái kích hoạt (1: active, 0: inactive)"
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
    tableName: 'settings',
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
        name: "setting_key",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "setting_key" },
        ]
      },
    ]
  });
};
