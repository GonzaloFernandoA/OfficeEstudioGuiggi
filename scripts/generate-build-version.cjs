const fs = require('fs');
const path = require('path');

function pad(n) { return String(n).padStart(2, '0'); }
const now = new Date();
const yyyy = now.getFullYear();
const mm = pad(now.getMonth() + 1);
const dd = pad(now.getDate());
const version = `v${yyyy}${mm}${dd}`;

const content = `export const BUILD_VERSION = '${version}';\n`;
const outPath = path.join(__dirname, '..', 'buildInfo.ts');

try {
  fs.writeFileSync(outPath, content, { encoding: 'utf8' });
  console.log('Generated', outPath, '->', version);
} catch (err) {
  console.error('Failed to write buildInfo.ts', err);
  process.exit(1);
}

