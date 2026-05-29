const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'components', 'trip-doc', 'pages');
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace react-router-dom with next/navigation
    content = content.replace(/import\s+\{.*useNavigate.*\}\s+from\s+['"]react-router-dom['"];?/g, "import { useRouter } from 'next/navigation';");
    content = content.replace(/const\s+navigate\s*=\s*useNavigate\(\);?/g, "const router = useRouter();");
    content = content.replace(/navigate\(/g, "router.push(");
    
    // Also replace Link from react-router-dom if it exists
    content = content.replace(/import\s+\{.*Link.*\}\s+from\s+['"]react-router-dom['"];?/g, "import Link from 'next/link';");
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
