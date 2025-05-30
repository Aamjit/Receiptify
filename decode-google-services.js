const { log } = require('console');
const fs = require('fs');
const path = require('path');

// Get the base64 encoded string from environment variable
const googleServicesBase64 = process.env.GOOGLE_SERVICES_JSON;

if (!googleServicesBase64) {
  console.error('GOOGLE_SERVICES_JSON environment variable is not set');
  process.exit(1);
}

// Decode the base64 string
const googleServicesJson = Buffer.from(googleServicesBase64, 'base64').toString('utf8');

console.log('Decoded GOOGLE_SERVICES_JSON:', googleServicesJson);


// Ensure the android/app directory exists
const androidAppDir = path.join(__dirname, 'android', 'app');
if (!fs.existsSync(androidAppDir)) {
  fs.mkdirSync(androidAppDir, { recursive: true });
}

// Write the decoded content to google-services.json
fs.writeFileSync(
  path.join(androidAppDir, 'google-services.json'),
  googleServicesJson
);

console.log('Successfully created google-services.json');

// decode-google-services.js
// const fs = require('fs');
// const path = require('path');

// const googleServices = process.env.ANDROID_GOOGLE_SERVICES_JSON;

// console.log('ANDROID_GOOGLE_SERVICES_JSON:', googleServices);

// if (!googleServices) {
//   throw new Error('ANDROID_GOOGLE_SERVICES_JSON env variable is not set');
// }

// const filePath = path.join(__dirname, 'android', 'app', 'google-services.json');
// fs.writeFileSync(filePath, googleServices);
// console.log('google-services.json written to android/app/');