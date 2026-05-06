const UserRoute = require('./UserRoute');
const initRoutes = (app) =>{
    app.use("/user",UserRoute);
}
module.exports = initRoutes;