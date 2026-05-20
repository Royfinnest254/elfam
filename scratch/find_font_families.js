const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk('c:/Users/roych/Downloads/Elfam/src');
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('fontFamily')) {
    console.log(`File has fontFamily override: ${file}`);
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('fontFamily')) {
        console.log(`  Line ${idx+1}: ${line.trim()}`);
      }
    });
  }
});
