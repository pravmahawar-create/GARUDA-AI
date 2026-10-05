const sharp = require('sharp');
const fs = require('fs');

async function createFeatheredSigil() {
  const width = 1436;
  const height = 830;

  const svgMask = Buffer.from(`
    <svg width="${width}" height="${height}">
      <defs>
        <radialGradient id="fade" cx="50%" cy="50%" rx="48%" ry="48%">
          <stop offset="60%" stop-color="#ffffff" stop-opacity="1" />
          <stop offset="85%" stop-color="#ffffff" stop-opacity="0.6" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#fade)" />
    </svg>
  `);

  await sharp('C:/Users/hp/OneDrive/Desktop/GARUDA/STATUS_POSTERS/garuda_eagle_sigil_clean.png')
    .ensureAlpha()
    .composite([{ input: svgMask, blend: 'dest-in' }])
    .png()
    .toFile('C:/Users/hp/OneDrive/Desktop/GARUDA/STATUS_POSTERS/garuda_eagle_feathered.png');

  console.log('Feathered sigil created successfully');
}

createFeatheredSigil().catch(console.error);
