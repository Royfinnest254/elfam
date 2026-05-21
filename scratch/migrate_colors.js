const fs = require('fs');
const path = require('path');

// Map old hardcoded hex → new Google-style hex
const colorMap = [
  // Navy / dark backgrounds → deep blue primary
  ['#0F1B2D', '#1A56DB'],
  ['#080f1a', '#103FA8'],
  ['#080F1A', '#103FA8'],
  ['#0A1220', '#103FA8'],
  ['#1a2e4a', '#1749C0'],
  ['#1A2E4A', '#1749C0'],
  // Teal → deep blue
  ['#00869B', '#1A56DB'],
  ['#008698', '#1A56DB'],
  // Teal bg → E8F0FE (Google active tint)
  ['#EBF7F9', '#E8F0FE'],
  ['#ebf7f9', '#E8F0FE'],
  ['#E6F3F5', '#E8F0FE'],
  // Gold → grey
  ['#C09E5A', '#5F6368'],
  ['#c09e5a', '#5F6368'],
  ['#FBF6EC', '#F8F9FA'],
  ['#fbf6ec', '#F8F9FA'],
  // Old bg / surfaces
  ['#F4F5F7', '#F8F9FA'],
  ['#f4f5f7', '#F8F9FA'],
  ['#F0F2F5', '#F8F9FA'],
  ['#f0f2f5', '#F8F9FA'],
  // Old borders
  ['#DFE1E6', '#DADCE0'],
  ['#dfe1e6', '#DADCE0'],
  ['#E4E7EC', '#DADCE0'],
  ['#e4e7ec', '#DADCE0'],
  // Old muted greys → Google grey
  ['#5E6C84', '#5F6368'],
  ['#5e6c84', '#5F6368'],
  ['#6B7280', '#5F6368'],
  ['#6b7280', '#5F6368'],
  ['#9CA3AF', '#9AA0A6'],
  ['#9ca3af', '#9AA0A6'],
  // Old text / ink
  ['#091E42', '#202124'],
  ['#091e42', '#202124'],
  ['#111827', '#202124'],
  ['#374151', '#5F6368'],
  ['#4B5563', '#5F6368'],
  // Status / alert colours that shifted
  ['#FF5630', '#D93025'],
  ['#ff5630', '#D93025'],
  ['#BF2600', '#D93025'],
  ['#bf2600', '#D93025'],
  ['#36B37E', '#1E8E3E'],
  ['#006644', '#1E8E3E'],
  // Old greys used in hover states
  ['#F3F4F6', '#F1F3F4'],
  ['#F9FAFB', '#F8F9FA'],
  ['#f9fafb', '#F8F9FA'],
  ['#F9FAFb', '#F8F9FA'],
];

const extensions = ['.tsx', '.ts', '.css'];
const srcDir = path.join(__dirname, '../src');

let totalFiles = 0;
let totalChanges = 0;

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      walkDir(fullPath);
    } else if (extensions.includes(path.extname(entry.name))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      let fileChanges = 0;
      for (const [from, to] of colorMap) {
        const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = content.match(regex);
        if (matches) {
          fileChanges += matches.length;
          content = content.replace(regex, to);
        }
      }
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        totalFiles++;
        totalChanges += fileChanges;
        console.log(`  ✓ ${path.relative(srcDir, fullPath)} (${fileChanges} replacements)`);
      }
    }
  }
}

console.log('🎨 Sweeping hardcoded hex colors → Google palette...\n');
walkDir(srcDir);
console.log(`\n✅ Done: ${totalChanges} replacements across ${totalFiles} files.`);
