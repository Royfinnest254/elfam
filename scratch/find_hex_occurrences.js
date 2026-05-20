const fs = require('fs');
const path = require('path');

const dirToSearch = path.join(__dirname, '../src');

const hexMap = {
  '#0F1B2D': '#1A56DB',
  '#080f1a': '#103FA8',
  '#0A1220': '#103FA8',
  '#1a2e4a': '#103FA8',
  '#00869B': '#1A56DB',
  '#EBF7F9': '#E8F0FE',
  '#C09E5A': '#5F6368',
  '#FBF6EC': '#F8F9FA',
  '#F4F5F7': '#F8F9FA',
  '#F0F2F5': '#F8F9FA',
  '#DFE1E6': '#DADCE0',
  '#E4E7EC': '#DADCE0',
  '#5E6C84': '#5F6368',
  '#6B7280': '#5F6368',
  '#091E42': '#202124',
  '#111827': '#202124',
};

const hexRegex = new RegExp(Object.keys(hexMap).join('|'), 'gi');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const occurrences = {};

walkDir(dirToSearch, (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.css')) return;
  const content = fs.readFileSync(filePath, 'utf8');
  let match;
  while ((match = hexRegex.exec(content)) !== null) {
    const matchedHex = match[0].toUpperCase();
    if (!occurrences[filePath]) occurrences[filePath] = {};
    occurrences[filePath][matchedHex] = (occurrences[filePath][matchedHex] || 0) + 1;
  }
});

console.log(JSON.stringify(occurrences, null, 2));
