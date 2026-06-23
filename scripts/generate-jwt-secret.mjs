import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const secret = crypto.randomBytes(32).toString('hex');

console.log('\n✓ Generated JWT_SECRET:');
console.log(secret);
console.log('\nAdd to .env:');
console.log(`JWT_SECRET=${secret}\n`);

// Optionally write to .env if it exists
const envPath = path.resolve('.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  if (!content.includes('JWT_SECRET')) {
    fs.appendFileSync(envPath, `\nJWT_SECRET=${secret}\n`);
    console.log(`✓ Added to .env file`);
  } else {
    console.log('⚠️  JWT_SECRET already exists in .env, skipping write');
  }
}
