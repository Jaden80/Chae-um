const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'components', 'trip-doc', 'pages');
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace '/step/...' with '/doc-wizard/step/...'
    content = content.replace(/router\.push\(['"]\/step\//g, "router.push('/doc-wizard/step/");
    content = content.replace(/router\.push\(['"]\/settings['"]\)/g, "router.push('/doc-wizard/settings')");
    content = content.replace(/router\.push\(['"]\/error['"]\)/g, "router.push('/doc-wizard/error')");
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated paths in ${file}`);
  }
});
