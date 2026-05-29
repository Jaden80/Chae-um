const fs = require('fs');
const content = fs.readFileSync('app/api/recommend/route.ts', 'utf8');
const lines = content.split('\n');
for (let i = 778; i < 826; i++) {
  console.log(`${i + 1}: ${JSON.stringify(lines[i])}`);
}
