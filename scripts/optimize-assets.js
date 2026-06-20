const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const assetsDir = path.join(__dirname, '..', 'assets');
const logoPath = path.join(assetsDir, 'logo.png');
const logoSmallPath = path.join(assetsDir, 'logo-sm.png');
const backupPath = path.join(assetsDir, 'logo.original.png');

async function optimizeAssets() {
  if (!fs.existsSync(logoPath)) {
    console.error('logo.png not found');
    process.exit(1);
  }

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(logoPath, backupPath);
  }

  const iconBuffer = await sharp(backupPath)
    .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ compressionLevel: 9, palette: true, quality: 80, effort: 10 })
    .toBuffer();

  const smallBuffer = await sharp(backupPath)
    .resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ compressionLevel: 9, palette: true, quality: 75, effort: 10 })
    .toBuffer();

  fs.writeFileSync(logoPath, iconBuffer);
  fs.writeFileSync(logoSmallPath, smallBuffer);

  const before = fs.statSync(backupPath).size;
  const iconAfter = fs.statSync(logoPath).size;
  const smallAfter = fs.statSync(logoSmallPath).size;
  console.log(`logo.png optimized: ${Math.round(before / 1024)}KB -> ${Math.round(iconAfter / 1024)}KB`);
  console.log(`logo-sm.png created: ${Math.round(smallAfter / 1024)}KB`);
}

optimizeAssets().catch((error) => {
  console.error(error);
  process.exit(1);
});
