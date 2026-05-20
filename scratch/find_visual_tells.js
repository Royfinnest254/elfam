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
  let issues = [];
  
  if (content.includes('fontFamily')) {
    issues.push('inline fontFamily override');
  }
  
  // Search for non-compliant rounded tags
  const roundedMatches = content.match(/rounded-(xl|2xl|3xl|18px|24px|32px|modal|system)/g);
  if (roundedMatches) {
    issues.push(`non-compliant rounded styles: ${[...new Set(roundedMatches)].join(', ')}`);
  }
  
  // Search for shadows
  const shadowMatches = content.match(/\bshadow-(md|lg|xl|2xl|premium|elevated)\b/g);
  if (shadowMatches) {
    issues.push(`shadow styles: ${[...new Set(shadowMatches)].join(', ')}`);
  }

  if (issues.length > 0) {
    console.log(`File: ${path.relative('c:/Users/roych/Downloads/Elfam', file)}`);
    issues.forEach(issue => console.log(`  - ${issue}`));
  }
});
