const UserRoute = require('./UserRoute');
const CategoryRoute = require('./CategoryRouter');
const initRoutes = (app) =>{
    app.use("/user",UserRoute);
    app.use("/category",CategoryRoute);
}
module.exports = initRoutes;