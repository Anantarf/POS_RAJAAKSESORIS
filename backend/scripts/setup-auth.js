import mysql from 'mysql2/promise';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

function hashPassword(password) {
  return crypto
    .pbkdf2Sync(password, 'pos-salt-2024', 10000, 64, 'sha256')
    .toString('base64');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'pos_raja_db',
  };

  console.log('🔧 Setup Custom Authentication for POS Raja Aksesoris');
  console.log('---');

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✓ Connected to database');

    // Create users table
    console.log('Creating users table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('kasir', 'pemilik') NOT NULL DEFAULT 'kasir',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        INDEX idx_username (username),
        INDEX idx_deleted_at (deleted_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Users table created/verified');

    // Check if users already exist
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL');
    const userCount = users[0]?.count || 0;

    if (userCount > 0) {
      console.log(`\n⚠️  Database sudah memiliki ${userCount} user(s).`);
      const confirm = await prompt('Lanjutkan? (y/n): ');
      if (confirm.toLowerCase() !== 'y') {
        rl.close();
        connection.end();
        return;
      }
    }

    console.log('\n📝 Setup Admin Account');
    console.log('---');
    const username = await prompt('Username: ');
    if (!username.trim()) {
      console.error('❌ Username tidak boleh kosong');
      rl.close();
      connection.end();
      return;
    }

    const password = await prompt('Password: ');
    if (!password || password.length < 6) {
      console.error('❌ Password minimal 6 karakter');
      rl.close();
      connection.end();
      return;
    }

    const userId = crypto.randomUUID();
    const passwordHash = hashPassword(password);

    try {
      await connection.execute(
        'INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)',
        [userId, String(username).trim().toLowerCase(), passwordHash, 'pemilik']
      );
      console.log('✓ Admin user berhasil dibuat');
      console.log(`  ID: ${userId}`);
      console.log(`  Username: ${username}`);
      console.log(`  Role: pemilik`);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.error('❌ Username sudah ada');
      } else {
        throw error;
      }
    }

    console.log('\n✅ Setup selesai!');
    console.log('\nTambahkan ke .env file:');
    console.log('JWT_SECRET=your-secret-key-here (ganti dengan string panjang yang aman)');
    console.log('\nGunakan endpoint /api/auth/login dengan username dan password yang tadi dibuat.');

    connection.end();
    rl.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

main();
