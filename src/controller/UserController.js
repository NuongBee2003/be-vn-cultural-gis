const db = require('../models');
const User = db.User;

class UserController{
    async getAll(req,res){
        try {
            const users = await User.findAll();
            res.status(200).json(users);
        } catch (error) {
            console.log("ERROR: " + error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}
module.exports = new UserController(); 