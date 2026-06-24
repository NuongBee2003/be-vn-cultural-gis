const db = require('../models');
const { Setting } = db;

class SettingController {
  // Lấy danh sách setting đang active
  async getAllSettings() {
    return Setting.findAll({
      where: { is_active: 1 },
      attributes: ['setting_key', 'setting_value', 'description']
    });
  }

  // Cập nhật cấu hình
  async updateSettingsBulk(settingsToUpdate) {
    if (!Array.isArray(settingsToUpdate)) {
      const err = new Error("Dữ liệu phải là mảng các settings");
      err.statusCode = 400;
      throw err;
    }

    const promises = settingsToUpdate.map(async (item) => {
      const { setting_key, setting_value } = item;
      if (!setting_key) return;

      const existing = await Setting.findOne({ where: { setting_key } });
      if (existing) {
        existing.setting_value = setting_value;
        existing.updated_at = new Date();
        return existing.save();
      } else {
        return Setting.create({
          setting_key,
          setting_value,
          is_active: 1
        });
      }
    });

    await Promise.all(promises);
    return { success: true };
  }
}

module.exports = new SettingController();
