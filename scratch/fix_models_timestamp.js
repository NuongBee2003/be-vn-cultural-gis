const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../src/models');
console.log('🔍 Scanning models in:', modelsDir);

fs.readdirSync(modelsDir).forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(modelsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('defaultValue: "CURRENT_TIMESTAMP(3)"')) {
      // Thay thế chuỗi bằng Sequelize.literal để tránh lỗi parse Invalid Date của Sequelize
      content = content.replace('defaultValue: "CURRENT_TIMESTAMP(3)"', "defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)')");
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('✅ Updated:', file);
    }
  }
});

console.log('🎉 Done fixing models!');
