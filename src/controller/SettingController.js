const db = require('../models');
const { Setting } = db;

class SettingController {
  // Lấy danh sách setting đang active
  static async getAllSettings(req, res) {
    try {
      const settings = await Setting.findAll({
        where: { is_active: 1 },
        attributes: ['setting_key', 'setting_value', 'description']
      });
      return res.status(200).json(settings);
    } catch (error) {
      console.error("Lỗi get settings:", error);
      return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  }

  // Cập nhật cấu hình (Nhận vào array các settings [{ setting_key, setting_value }, ...])
  static async updateSettingsBulk(req, res) {
    try {
      const settingsToUpdate = req.body.settings;
      
      if (!Array.isArray(settingsToUpdate)) {
        return res.status(400).json({ message: "Dữ liệu phải là mảng các settings" });
      }

      // Xử lý upsert cho từng setting
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

      return res.status(200).json({ message: "Cập nhật thành công" });
    } catch (error) {
      console.error("Lỗi update settings:", error);
      return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  }
}

module.exports = SettingController;
