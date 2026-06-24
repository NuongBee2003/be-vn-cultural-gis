const asyncHandler = require('../utils/asyncHandler');
const settingController = require('../controller/SettingController');

class SettingManager {
  getAllSettings = asyncHandler(async (req, res) => {
    const settings = await settingController.getAllSettings();
    return res.status(200).json(settings);
  });

  updateSettingsBulk = asyncHandler(async (req, res) => {
    await settingController.updateSettingsBulk(req.body.settings);
    return res.status(200).json({ message: "Cập nhật thành công" });
  });
}

module.exports = new SettingManager();
