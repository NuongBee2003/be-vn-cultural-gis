const UserRoute = require('./UserRoute');
const AuthRoute = require('./AuthRoute');
const PlaceRoute = require('./PlaceRouter');
const LocationRoute = require('./LocationRouter');
const CategoryRoute = require('./CategoryRouter');
const SearchRoute = require('./SearchRouter');
const initRoutes = (app) =>{
    app.use("/api/v1/auth", AuthRoute);
    app.use("/api/v1/user", UserRoute);
    app.use("/api/v1/place", PlaceRoute);
    app.use("/api/v1/location", LocationRoute);
    app.use("/api/v1/category", CategoryRoute);
    app.use("/api/v1/search", SearchRoute);
}
module.exports = initRoutes;