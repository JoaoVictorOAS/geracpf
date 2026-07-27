import fs from 'fs';
import path from 'path';

function createMinimalPngBuffer() {
  const basePngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  return Buffer.from(basePngBase64, 'base64');
}

const iconsDir = path.resolve(process.cwd(), 'public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, 'icon16.png'), createMinimalPngBuffer());
fs.writeFileSync(path.join(iconsDir, 'icon48.png'), createMinimalPngBuffer());
fs.writeFileSync(path.join(iconsDir, 'icon128.png'), createMinimalPngBuffer());

console.log('PNG Icons generated successfully.');
