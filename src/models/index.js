const sequelize = require('../config/connectionDB');
const initModels = require('./init-models');

const db = initModels(sequelize);

db.sequelize = sequelize;
db.Sequelize = require('sequelize');
db.initModels = initModels;

module.exports = db;
