import process from 'node:process';
import 'dotenv/config';

const REQUIRED_ENV = {
  always: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
  ],
  backend: [
    'CORS_ORIGIN',
    'FONNTE_TOKEN',
  ],
};

const WARNING_ENV = [
  'DB_HOST',
  'DB_USER',
  'DB_NAME',
];

function validateEnv() {
  const errors = [];
  const warnings = [];
  const env = process.env;

  // Check required vars
  for (const key of REQUIRED_ENV.always) {
    const value = String(env[key] || '').trim();
    if (!value) {
      errors.push(`❌ Missing required: ${key}`);
    } else if (value.includes('your-') || value.includes('YOUR_')) {
      errors.push(`❌ Not configured (template value): ${key}`);
    }
  }

  // Check backend-specific if not Vercel
  if (env.NODE_ENV !== 'vercel' && env.VERCEL !== 'true') {
    for (const key of REQUIRED_ENV.backend) {
      const value = String(env[key] || '').trim();
      if (!value) {
        warnings.push(`⚠️  Missing recommended: ${key}`);
      }
    }
  }

  // Check MySQL if legacy enabled
  if (env.ENABLE_LEGACY_MYSQL_ROUTES === 'true') {
    for (const key of ['DB_HOST', 'DB_USER', 'DB_NAME']) {
      const value = String(env[key] || '').trim();
      if (!value) {
        errors.push(`❌ MySQL legacy enabled but missing: ${key}`);
      }
    }
  }

  // Check JWT_SECRET length
  const jwtSecret = String(env.JWT_SECRET || '').trim();
  if (jwtSecret && jwtSecret.length < 32) {
    warnings.push(`⚠️  JWT_SECRET too short (${jwtSecret.length}), recommend 32+ chars`);
  }

  // Check Supabase URL format
  const supabaseUrl = String(env.SUPABASE_URL || '').trim();
  if (supabaseUrl && !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(supabaseUrl)) {
    errors.push(`❌ SUPABASE_URL invalid format: ${supabaseUrl}`);
  }

  return { errors, warnings };
}

function main() {
  const { errors, warnings } = validateEnv();

  if (errors.length > 0) {
    console.error('\n🔴 Environment Validation Failed:\n');
    errors.forEach(e => console.error(e));
    console.error('\n📋 Setup guide:');
    console.error('1. Copy .env.example to .env');
    console.error('2. Fill Supabase credentials from Supabase Dashboard > Settings > API');
    console.error('3. Generate JWT_SECRET: node scripts/generate-jwt-secret.mjs');
    console.error('4. Rerun: npm run verify:env\n');
    process.exitCode = 1;
    return;
  }

  console.log('✅ Environment validation passed');
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(w => console.warn(w));
  }
  console.log('');
}

main();
