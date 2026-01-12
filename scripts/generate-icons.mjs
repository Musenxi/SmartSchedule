import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, '../public/logo.svg');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

const sizes = [192, 512];

async function generateIcons() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const size of sizes) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
    console.log(`Generating ${outputPath}...`);
    try {
      await sharp(INPUT_FILE)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`Generated ${outputPath}`);
    } catch (error) {
      console.error(`Error generating ${outputPath}:`, error);
    }
  }
}

generateIcons();
