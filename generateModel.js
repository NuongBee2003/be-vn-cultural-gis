const SequelizeAuto = require('sequelize-auto');
const auto = new SequelizeAuto(
  process.env.DATABASE_NAME,
  process.env.DATABASE_USER,
  process.env.DATABASE_PASSWORD,
  {
    dialect: 'mysql',
    directory: './src/models', 
    additional: {
      timestamps: false 
    },
  caseModel: 'p', 
  caseFile: 'c',  
  singularize: true, 
  lang: 'es5',
});

auto.run()
  .then(() => {
    console.log('✅ Generate model thành công!');
  })
  .catch(err => {
    console.error('❌ Lỗi khi generate model:', err);
  });