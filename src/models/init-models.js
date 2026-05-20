var DataTypes = require("sequelize").DataTypes;
var _PrismaMigration = require("./prismaMigration");
var _Asset = require("./asset");
var _Category = require("./category");
var _CheckIn = require("./checkIn");
var _Comment = require("./comment");
var _District = require("./district");
var _Location = require("./location");
var _Place = require("./place");
var _PostLike = require("./postLike");
var _Post = require("./post");
var _ReviewLike = require("./reviewLike");
var _Review = require("./review");
var _User = require("./user");
var _Wishlist = require("./wishlist");

function initModels(sequelize) {
  var PrismaMigration = _PrismaMigration(sequelize, DataTypes);
  var Asset = _Asset(sequelize, DataTypes);
  var Category = _Category(sequelize, DataTypes);
  var CheckIn = _CheckIn(sequelize, DataTypes);
  var Comment = _Comment(sequelize, DataTypes);
  var District = _District(sequelize, DataTypes);
  var Location = _Location(sequelize, DataTypes);
  var Place = _Place(sequelize, DataTypes);
  var PostLike = _PostLike(sequelize, DataTypes);
  var Post = _Post(sequelize, DataTypes);
  var ReviewLike = _ReviewLike(sequelize, DataTypes);
  var Review = _Review(sequelize, DataTypes);
  var User = _User(sequelize, DataTypes);
  var Wishlist = _Wishlist(sequelize, DataTypes);

  Post.belongsToMany(User, { as: 'user_id_users', through: PostLike, foreignKey: "post_id", otherKey: "user_id" });
  Review.belongsToMany(User, { as: 'user_id_users_review_likes', through: ReviewLike, foreignKey: "review_id", otherKey: "user_id" });
  User.belongsToMany(Post, { as: 'post_id_posts', through: PostLike, foreignKey: "user_id", otherKey: "post_id" });
  User.belongsToMany(Review, { as: 'review_id_reviews', through: ReviewLike, foreignKey: "user_id", otherKey: "review_id" });
  Place.belongsTo(Category, { as: "category", foreignKey: "category_id"});
  Category.hasMany(Place, { as: "places", foreignKey: "category_id"});
  Location.belongsTo(District, { as: "district", foreignKey: "district_id"});
  District.hasMany(Location, { as: "locations", foreignKey: "district_id"});
  CheckIn.belongsTo(Location, { as: "location", foreignKey: "location_id"});
  Location.hasMany(CheckIn, { as: "check_ins", foreignKey: "location_id"});
  Post.belongsTo(Location, { as: "location", foreignKey: "location_id"});
  Location.hasMany(Post, { as: "posts", foreignKey: "location_id"});
  Review.belongsTo(Location, { as: "location", foreignKey: "location_id"});
  Location.hasMany(Review, { as: "reviews", foreignKey: "location_id"});
  Asset.belongsTo(Place, { as: "place", foreignKey: "place_id"});
  Place.hasMany(Asset, { as: "assets", foreignKey: "place_id"});
  Location.belongsTo(Place, { as: "place", foreignKey: "place_id"});
  Place.hasMany(Location, { as: "locations", foreignKey: "place_id"});
  Asset.belongsTo(Post, { as: "post", foreignKey: "post_id"});
  Post.hasMany(Asset, { as: "assets", foreignKey: "post_id"});
  Comment.belongsTo(Post, { as: "post", foreignKey: "post_id"});
  Post.hasMany(Comment, { as: "comments", foreignKey: "post_id"});
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
  PostLike.belongsTo(User, { as: "user", foreignKey: "user_id"});
  User.hasMany(PostLike, { as: "post_likes", foreignKey: "user_id"});
  Post.belongsTo(User, { as: "user", foreignKey: "user_id"});
  User.hasMany(Post, { as: "posts", foreignKey: "user_id"});
  ReviewLike.belongsTo(User, { as: "user", foreignKey: "user_id"});
  User.hasMany(ReviewLike, { as: "review_likes", foreignKey: "user_id"});
  Review.belongsTo(User, { as: "user", foreignKey: "user_id"});
  User.hasMany(Review, { as: "reviews", foreignKey: "user_id"});
  Wishlist.belongsTo(User, { as: "user", foreignKey: "user_id"});
  User.hasMany(Wishlist, { as: "wishlists", foreignKey: "user_id"});

  return {
    PrismaMigration,
    Asset,
    Category,
    CheckIn,
    Comment,
    District,
    Location,
    Place,
    PostLike,
    Post,
    ReviewLike,
    Review,
    User,
    Wishlist,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
