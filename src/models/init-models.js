var DataTypes = require("sequelize").DataTypes;
var _PrismaMigration = require("./prismaMigration");
var _Asset = require("./asset");
var _Category = require("./category");
var _CheckIn = require("./checkIn");
var _Comment = require("./comment");
var _CuisinePlace = require("./cuisinePlace");
var _Cuisine = require("./cuisine");
var _Custom = require("./custom");
var _Exhibition = require("./exhibition");
var _FolkArt = require("./folkArt");
var _Holiday = require("./holiday");
var _Location = require("./location");
var _Notification = require("./notification");
var _Package = require("./package");
var _Place = require("./place");
var _PostLike = require("./postLike");
var _Post = require("./post");
var _Product = require("./product");
var _ReviewLike = require("./reviewLike");
var _Review = require("./review");
var _SchemaMigration = require("./schemaMigration");
var _Setting = require("./setting");
var _UserSubscription = require("./userSubscription");
var _User = require("./user");
var _Wishlist = require("./wishlist");
var _Invoice = require("./invoice");


function initModels(sequelize) {
  var PrismaMigration = _PrismaMigration(sequelize, DataTypes);
  var Asset = _Asset(sequelize, DataTypes);
  var Category = _Category(sequelize, DataTypes);
  var CheckIn = _CheckIn(sequelize, DataTypes);
  var Comment = _Comment(sequelize, DataTypes);
  var CuisinePlace = _CuisinePlace(sequelize, DataTypes);
  var Cuisine = _Cuisine(sequelize, DataTypes);
  var Custom = _Custom(sequelize, DataTypes);
  var Exhibition = _Exhibition(sequelize, DataTypes);
  var FolkArt = _FolkArt(sequelize, DataTypes);
  var Holiday = _Holiday(sequelize, DataTypes);
  var Location = _Location(sequelize, DataTypes);
  var Notification = _Notification(sequelize, DataTypes);
  var Package = _Package(sequelize, DataTypes);
  var Place = _Place(sequelize, DataTypes);
  var PostLike = _PostLike(sequelize, DataTypes);
  var Post = _Post(sequelize, DataTypes);
  var Product = _Product(sequelize, DataTypes);
  var ReviewLike = _ReviewLike(sequelize, DataTypes);
  var Review = _Review(sequelize, DataTypes);
  var SchemaMigration = _SchemaMigration(sequelize, DataTypes);
  var Setting = _Setting(sequelize, DataTypes);
  var UserSubscription = _UserSubscription(sequelize, DataTypes);
  var User = _User(sequelize, DataTypes);
  var Wishlist = _Wishlist(sequelize, DataTypes);
  var Invoice = _Invoice(sequelize, DataTypes);


  Post.belongsToMany(User, { as: 'user_id_users', through: PostLike, foreignKey: "post_id", otherKey: "user_id" });
  Review.belongsToMany(User, { as: 'user_id_users_review_likes', through: ReviewLike, foreignKey: "review_id", otherKey: "user_id" });
  User.belongsToMany(Post, { as: 'post_id_posts', through: PostLike, foreignKey: "user_id", otherKey: "post_id" });
  User.belongsToMany(Review, { as: 'review_id_reviews', through: ReviewLike, foreignKey: "user_id", otherKey: "review_id" });
  Place.belongsTo(Category, { as: "category", foreignKey: "category_id"});
  Category.hasMany(Place, { as: "places", foreignKey: "category_id"});
  Comment.belongsTo(Comment, { as: "parent", foreignKey: "parent_id"});
  Comment.hasMany(Comment, { as: "comments", foreignKey: "parent_id"});
  Notification.belongsTo(Comment, { as: "comment", foreignKey: "comment_id"});
  Comment.hasMany(Notification, { as: "notifications", foreignKey: "comment_id"});
  CuisinePlace.belongsTo(Cuisine, { as: "cuisine", foreignKey: "cuisine_id"});
  Cuisine.hasMany(CuisinePlace, { as: "cuisine_places", foreignKey: "cuisine_id"});
  Asset.belongsTo(Location, { as: "location", foreignKey: "location_id"});
  Location.hasMany(Asset, { as: "assets", foreignKey: "location_id"});
  CheckIn.belongsTo(Location, { as: "location", foreignKey: "location_id"});
  Location.hasMany(CheckIn, { as: "check_ins", foreignKey: "location_id"});
  Post.belongsTo(Location, { as: "location", foreignKey: "location_id"});
  Location.hasMany(Post, { as: "posts", foreignKey: "location_id"});
  Review.belongsTo(Location, { as: "location", foreignKey: "location_id"});
  Location.hasMany(Review, { as: "reviews", foreignKey: "location_id"});
  UserSubscription.belongsTo(Package, { as: "package", foreignKey: "package_id"});
  Package.hasMany(UserSubscription, { as: "user_subscriptions", foreignKey: "package_id"});
  CuisinePlace.belongsTo(Place, { as: "place", foreignKey: "place_id"});
  Place.hasMany(CuisinePlace, { as: "cuisine_places", foreignKey: "place_id"});
  Location.belongsTo(Place, { as: "place", foreignKey: "place_id"});
  Place.hasMany(Location, { as: "locations", foreignKey: "place_id"});
  Asset.belongsTo(Post, { as: "post", foreignKey: "post_id"});
  Post.hasMany(Asset, { as: "assets", foreignKey: "post_id"});
  Comment.belongsTo(Post, { as: "post", foreignKey: "post_id"});
  Post.hasMany(Comment, { as: "comments", foreignKey: "post_id"});
  Notification.belongsTo(Post, { as: "post", foreignKey: "post_id"});
  Post.hasMany(Notification, { as: "notifications", foreignKey: "post_id"});
  PostLike.belongsTo(Post, { as: "post", foreignKey: "post_id"});
  Post.hasMany(PostLike, { as: "post_likes", foreignKey: "post_id"});
  Asset.belongsTo(Review, { as: "review", foreignKey: "review_id"});
  Review.hasMany(Asset, { as: "assets", foreignKey: "review_id"});
  ReviewLike.belongsTo(Review, { as: "review", foreignKey: "review_id"});
  Review.hasMany(ReviewLike, { as: "review_likes", foreignKey: "review_id"});
  CheckIn.belongsTo(User, { as: "user", foreignKey: "user_id"});
  User.hasMany(CheckIn, { as: "check_ins", foreignKey: "user_id"});
  Comment.belongsTo(User, { as: "user", foreignKey: "user_id"});
  User.hasMany(Comment, { as: "comments", foreignKey: "user_id"});
  Exhibition.belongsTo(User, { as: "user", foreignKey: "user_id"});
  User.hasMany(Exhibition, { as: "exhibitions", foreignKey: "user_id"});
  Notification.belongsTo(User, { as: "user", foreignKey: "user_id"});
  User.hasMany(Notification, { as: "notifications", foreignKey: "user_id"});
  Notification.belongsTo(User, { as: "actor", foreignKey: "actor_id"});
  User.hasMany(Notification, { as: "actor_notifications", foreignKey: "actor_id"});
  Place.belongsTo(User, { as: "user", foreignKey: "user_id"});
  User.hasMany(Place, { as: "places", foreignKey: "user_id"});
  PostLike.belongsTo(User, { as: "user", foreignKey: "user_id"});
  User.hasMany(PostLike, { as: "post_likes", foreignKey: "user_id"});
  Post.belongsTo(User, { as: "user", foreignKey: "user_id"});
  User.hasMany(Post, { as: "posts", foreignKey: "user_id"});
  Product.belongsTo(User, { as: "user", foreignKey: "user_id"});
  User.hasMany(Product, { as: "products", foreignKey: "user_id"});
  ReviewLike.belongsTo(User, { as: "user", foreignKey: "user_id"});
  User.hasMany(ReviewLike, { as: "review_likes", foreignKey: "user_id"});
  Review.belongsTo(User, { as: "user", foreignKey: "user_id"});
  User.hasMany(Review, { as: "reviews", foreignKey: "user_id"});
  UserSubscription.belongsTo(User, { as: "user", foreignKey: "user_id"});
  User.hasMany(UserSubscription, { as: "user_subscriptions", foreignKey: "user_id"});
  Wishlist.belongsTo(User, { as: "user", foreignKey: "user_id"});
  User.hasMany(Wishlist, { as: "wishlists", foreignKey: "user_id"});

  Invoice.belongsTo(User, { as: "user", foreignKey: "user_id"});
  User.hasMany(Invoice, { as: "invoices", foreignKey: "user_id"});
  Invoice.belongsTo(UserSubscription, { as: "subscription", foreignKey: "subscription_id"});
  UserSubscription.hasMany(Invoice, { as: "invoices", foreignKey: "subscription_id"});


  return {
    PrismaMigration,
    Asset,
    Category,
    CheckIn,
    Comment,
    CuisinePlace,
    Cuisine,
    Custom,
    Exhibition,
    FolkArt,
    Holiday,
    Location,
    Notification,
    Package,
    Place,
    PostLike,
    Post,
    Product,
    ReviewLike,
    Review,
    SchemaMigration,
    Setting,
    UserSubscription,
    User,
    Wishlist,
    Invoice,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
