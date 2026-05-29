const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'components', 'trip-doc', 'layout');
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace react-router-dom with next/navigation and next/link
    content = content.replace(/import\s+\{.*useLocation.*\}\s+from\s+['"]react-router-dom['"];?/g, "import { usePathname } from 'next/navigation';");
    content = content.replace(/const\s+location\s*=\s*useLocation\(\);?/g, "const pathname = usePathname();");
    content = content.replace(/location\.pathname/g, "pathname");
    
    // Replace Link from react-router-dom if it exists
    content = content.replace(/import\s+\{.*Link.*\}\s+from\s+['"]react-router-dom['"];?/g, "import Link from 'next/link';");
    
    // Replace '/step/...' with '/doc-wizard/step/...' in Link tags or general strings
    content = content.replace(/to=['"]\/step\//g, "href='/doc-wizard/step/");
    content = content.replace(/to=['"]\/settings['"]/g, "href='/doc-wizard/settings'");
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
