var DataTypes = require("sequelize").DataTypes;
var _PrismaMigration = require("./prismaMigration");
var _Asset = require("./asset");
var _Booking = require("./booking");
var _Category = require("./category");
var _CheckIn = require("./checkIn");
var _HistoricalEvent = require("./historicalEvent");
var _HistoricalPeriod = require("./historicalPeriod");
var _Location = require("./location");
var _PlacePeriod = require("./placePeriod");
var _Place = require("./place");
var _Post = require("./post");
var _Province = require("./province");
var _Region = require("./region");
var _Review = require("./review");
var _TourItinerary = require("./tourItinerary");
var _Tour = require("./tour");
var _User = require("./user");
var _WishlistDetail = require("./wishlistDetail");
var _Wishlist = require("./wishlist");

function initModels(sequelize) {
  var PrismaMigration = _PrismaMigration(sequelize, DataTypes);
  var Asset = _Asset(sequelize, DataTypes);
  var Booking = _Booking(sequelize, DataTypes);
  var Category = _Category(sequelize, DataTypes);
  var CheckIn = _CheckIn(sequelize, DataTypes);
  var HistoricalEvent = _HistoricalEvent(sequelize, DataTypes);
  var HistoricalPeriod = _HistoricalPeriod(sequelize, DataTypes);
  var Location = _Location(sequelize, DataTypes);
  var PlacePeriod = _PlacePeriod(sequelize, DataTypes);
  var Place = _Place(sequelize, DataTypes);
  var Post = _Post(sequelize, DataTypes);
  var Province = _Province(sequelize, DataTypes);
  var Region = _Region(sequelize, DataTypes);
  var Review = _Review(sequelize, DataTypes);
  var TourItinerary = _TourItinerary(sequelize, DataTypes);
  var Tour = _Tour(sequelize, DataTypes);
  var User = _User(sequelize, DataTypes);
  var WishlistDetail = _WishlistDetail(sequelize, DataTypes);
  var Wishlist = _Wishlist(sequelize, DataTypes);

  HistoricalPeriod.belongsToMany(Place, { as: 'place_id_places', through: PlacePeriod, foreignKey: "period_id", otherKey: "place_id" });
  Place.belongsToMany(HistoricalPeriod, { as: 'period_id_historical_periods', through: PlacePeriod, foreignKey: "place_id", otherKey: "period_id" });
  Place.belongsTo(Category, { as: "category", foreignKey: "category_id"});
  Category.hasMany(Place, { as: "places", foreignKey: "category_id"});
  Asset.belongsTo(CheckIn, { as: "check_in", foreignKey: "check_in_id"});
  CheckIn.hasMany(Asset, { as: "assets", foreignKey: "check_in_id"});
  HistoricalEvent.belongsTo(HistoricalPeriod, { as: "period", foreignKey: "period_id"});
  HistoricalPeriod.hasMany(HistoricalEvent, { as: "historical_events", foreignKey: "period_id"});
  PlacePeriod.belongsTo(HistoricalPeriod, { as: "period", foreignKey: "period_id"});
  HistoricalPeriod.hasMany(PlacePeriod, { as: "place_periods", foreignKey: "period_id"});
  Asset.belongsTo(Location, { as: "location", foreignKey: "location_id"});
  Location.hasMany(Asset, { as: "assets", foreignKey: "location_id"});
  CheckIn.belongsTo(Location, { as: "location", foreignKey: "location_id"});
  Location.hasMany(CheckIn, { as: "check_ins", foreignKey: "location_id"});
  Post.belongsTo(Location, { as: "location", foreignKey: "location_id"});
  Location.hasMany(Post, { as: "posts", foreignKey: "location_id"});
  Review.belongsTo(Location, { as: "location", foreignKey: "location_id"});
  Location.hasMany(Review, { as: "reviews", foreignKey: "location_id"});
  TourItinerary.belongsTo(Location, { as: "location", foreignKey: "location_id"});
  Location.hasMany(TourItinerary, { as: "tour_itineraries", foreignKey: "location_id"});
  WishlistDetail.belongsTo(Location, { as: "location", foreignKey: "location_id"});
  Location.hasMany(WishlistDetail, { as: "wishlist_details", foreignKey: "location_id"});
  Asset.belongsTo(Place, { as: "place", foreignKey: "place_id"});
  Place.hasMany(Asset, { as: "assets", foreignKey: "place_id"});
  Location.belongsTo(Place, { as: "place", foreignKey: "place_id"});
  Place.hasMany(Location, { as: "locations", foreignKey: "place_id"});
  PlacePeriod.belongsTo(Place, { as: "place", foreignKey: "place_id"});
  Place.hasMany(PlacePeriod, { as: "place_periods", foreignKey: "place_id"});
  Asset.belongsTo(Post, { as: "post", foreignKey: "post_id"});
  Post.hasMany(Asset, { as: "assets", foreignKey: "post_id"});
  Location.belongsTo(Province, { as: "province", foreignKey: "province_id"});
  Province.hasMany(Location, { as: "locations", foreignKey: "province_id"});
  Province.belongsTo(Region, { as: "region", foreignKey: "region_id"});
  Region.hasMany(Province, { as: "provinces", foreignKey: "region_id"});
  Asset.belongsTo(Review, { as: "review", foreignKey: "review_id"});
  Review.hasMany(Asset, { as: "assets", foreignKey: "review_id"});
  Booking.belongsTo(Tour, { as: "tour", foreignKey: "tour_id"});
  Tour.hasMany(Booking, { as: "bookings", foreignKey: "tour_id"});
  TourItinerary.belongsTo(Tour, { as: "tour", foreignKey: "tour_id"});
  Tour.hasMany(TourItinerary, { as: "tour_itineraries", foreignKey: "tour_id"});
  Booking.belongsTo(User, { as: "user", foreignKey: "user_id"});
  User.hasMany(Booking, { as: "bookings", foreignKey: "user_id"});
  CheckIn.belongsTo(User, { as: "user", foreignKey: "user_id"});
  User.hasMany(CheckIn, { as: "check_ins", foreignKey: "user_id"});
  Place.belongsTo(User, { as: "created_by_user", foreignKey: "created_by"});
  User.hasMany(Place, { as: "places", foreignKey: "created_by"});
  Post.belongsTo(User, { as: "user", foreignKey: "user_id"});
  User.hasMany(Post, { as: "posts", foreignKey: "user_id"});
  Review.belongsTo(User, { as: "user", foreignKey: "user_id"});
  User.hasMany(Review, { as: "reviews", foreignKey: "user_id"});
  Wishlist.belongsTo(User, { as: "user", foreignKey: "user_id"});
  User.hasMany(Wishlist, { as: "wishlists", foreignKey: "user_id"});
  WishlistDetail.belongsTo(Wishlist, { as: "wishlist", foreignKey: "wishlist_id"});
  Wishlist.hasMany(WishlistDetail, { as: "wishlist_details", foreignKey: "wishlist_id"});

  return {
    PrismaMigration,
    Asset,
    Booking,
    Category,
    CheckIn,
    HistoricalEvent,
    HistoricalPeriod,
    Location,
    PlacePeriod,
    Place,
    Post,
    Province,
    Region,
    Review,
    TourItinerary,
    Tour,
    User,
    WishlistDetail,
    Wishlist,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
