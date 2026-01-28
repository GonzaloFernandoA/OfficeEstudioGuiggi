const fs = require('fs');
const path = require('path');

function pad(n) { return String(n).padStart(2, '0'); }
const now = new Date();
const yyyy = now.getFullYear();
const mm = pad(now.getMonth() + 1);
const dd = pad(now.getDate());

// Leer número de build desde entorno CI (por ejemplo GitHub Actions)
// Prioridad: BUILD_NUMBER, luego GITHUB_RUN_NUMBER; si no existen, sin sufijo.
const buildNumber = process.env.BUILD_NUMBER || process.env.GITHUB_RUN_NUMBER || '';

// Base: fecha
let version = `v${yyyy}${mm}${dd}`;

// Si hay número de build, agregarlo como sufijo
if (buildNumber) {
  version = `${version}-b${buildNumber}`;
}

const content = `export const BUILD_VERSION = '${version}';\n`;
const outPath = path.join(__dirname, '..', 'buildInfo.ts');

try {
  fs.writeFileSync(outPath, content, { encoding: 'utf8' });
  console.log('Generated', outPath, '->', version);
} catch (err) {
  console.error('Failed to write buildInfo.ts', err);
  process.exit(1);
}
