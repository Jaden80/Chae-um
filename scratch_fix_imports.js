const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDir = path.join(__dirname, 'components', 'trip-doc');
walkDir(targetDir, function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace component imports
    content = content.replace(/@\/components\/common/g, "@/components/trip-doc/common");
    content = content.replace(/@\/components\/layout/g, "@/components/trip-doc/layout");
    
    // Check if react-router-dom is still there
    if (content.includes('react-router-dom')) {
      content = content.replace(/import\s+\{.*NavLink.*\}\s+from\s+['"]react-router-dom['"];?/g, "import Link from 'next/link';\nimport { usePathname } from 'next/navigation';");
      content = content.replace(/<NavLink/g, "<Link");
      content = content.replace(/<\/NavLink>/g, "</Link>");
      content = content.replace(/to=/g, "href=");
      // Naive cleanup for react-router-dom imports if any
      content = content.replace(/import.*from\s+['"]react-router-dom['"];?/g, "");
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
  }
});
console.log('Fixed imports in components/trip-doc');
