const UserRoute = require('./UserRoute');
const PlaceRoute = require('./PlaceRouter');
const LocationRoute = require('./LocationRouter');
const initRoutes = (app) =>{
    app.use("/api/v1/user",UserRoute);
    app.use("/api/v1/place",PlaceRoute);
    app.use("/api/v1/location",LocationRoute);
}
module.exports = initRoutes;