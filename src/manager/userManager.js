const userController = require('../controller/UserController');

class UserManager {
    async getAll(req, res) {
        try {
            const users = await userController.getAllUsers();
            return res.status(200).json(users);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.log('ERROR: ' + error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = new UserManager();
