const UserRoute = require('./UserRoute');
const PlaceRoute = require('./PlaceRouter');
const LocationRoute = require('./LocationRouter');
const CategoryRoute = require('./CategoryRouter');
const SearchRoute = require('./SearchRouter');
const CommentRoute = require('./CommentRouter');
const initRoutes = (app) =>{
    app.use("/api/v1/user",UserRoute);
    app.use("/api/v1/place",PlaceRoute);
    app.use("/api/v1/location",LocationRoute);
    app.use("/api/v1/category",CategoryRoute);
    app.use("/api/v1/search",SearchRoute);
    app.use("/api/v1/comment",CommentRoute);
}
module.exports = initRoutes;