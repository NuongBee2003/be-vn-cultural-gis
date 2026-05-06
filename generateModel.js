const SequelizeAuto = require('sequelize-auto');
const auto = new SequelizeAuto("traveldb", "root", "", {
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