require('dotenv').config();

const path = require('path');
const SequelizeAuto = require('sequelize-auto');

const getRequiredEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing env var ${name}. Did you create a .env file and load it (dotenv)?`
    );
  }
  return value;
};

const databaseName = getRequiredEnv('DATABASE_NAME');
const databaseUser = getRequiredEnv('DATABASE_USER');
const databasePassword = process.env.DATABASE_PASSWORD ?? '';

const databaseHost = process.env.DATABASE_HOST || 'localhost';
const databasePort = process.env.DATABASE_PORT
  ? Number(process.env.DATABASE_PORT)
  : undefined;

const auto = new SequelizeAuto(databaseName, databaseUser, databasePassword, {
  host: databaseHost,
  port: databasePort,
  dialect: 'mysql',
  directory: path.join(__dirname, 'src', 'models'),
  additional: {
    timestamps: false,
  },
  caseModel: 'p',
  caseFile: 'c',
  singularize: true,
  lang: 'es5',
});

const main = async () => {
  try {
    await auto.run();
    console.log('✅ Generate model thành công!');
  } catch (err) {
    console.error('❌ Lỗi khi generate model:', err);
    process.exitCode = 1;
  }
};

main();