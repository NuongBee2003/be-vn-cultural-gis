const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('PrismaMigration', {
    id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      primaryKey: true
    },
    checksum: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    finished_at: {
      type: DataTypes.DATE(3),
      allowNull: true
    },
    migration_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    logs: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rolled_back_at: {
      type: DataTypes.DATE(3),
      allowNull: true
    },
    started_at: {
      type: DataTypes.DATE(3),
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP(3)')
    },
    applied_steps_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    tableName: '_prisma_migrations',
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
