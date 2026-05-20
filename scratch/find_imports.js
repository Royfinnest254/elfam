const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/roych/Downloads/Elfam/convex';
fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.ts')) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    if (content.includes('import(')) {
      console.log(`File: ${file} contains dynamic import!`);
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('import(')) {
          console.log(`  Line ${index + 1}: ${line.trim()}`);
        }
      });
    }
  }
});
