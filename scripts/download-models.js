/**
 * Download face-api.js models
 * Run: node scripts/download-models.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const MODEL_URL_BASE = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'models');

const MODELS = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2'
];

// Create models directory
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

console.log('Downloading face-api.js models...\n');

let downloaded = 0;

MODELS.forEach((model) => {
  const url = `${MODEL_URL_BASE}/${model}`;
  const dest = path.join(PUBLIC_DIR, model);

  https.get(url, (response) => {
    const file = fs.createWriteStream(dest);
    response.pipe(file);

    file.on('finish', () => {
      file.close();
      downloaded++;
      console.log(`✓ Downloaded: ${model}`);

      if (downloaded === MODELS.length) {
        console.log(`\n✓ All models downloaded to ${PUBLIC_DIR}`);
      }
    });
  }).on('error', (err) => {
    fs.unlink(dest, () => {});
    console.error(`✗ Error downloading ${model}:`, err.message);
  });
});
