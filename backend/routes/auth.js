import express from 'express';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import crypto from 'crypto';
import { createRequestError } from '../server/requestSecurity.js';

const router = express.Router();

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw createRequestError(500, 'JWT_SECRET belum dikonfigurasi di backend.');
  }
  return secret;
}

function hashPassword(password) {
  return crypto
    .pbkdf2Sync(password, 'pos-salt-2024', 10000, 64, 'sha256')
    .toString('base64');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

function generateToken(userId, username, role) {
  const secret = getJwtSecret();
  return jwt.sign(
    { id: userId, username, role },
    secret,
    { expiresIn: '24h' }
  );
}

function verifyToken(token) {
  try {
    const secret = getJwtSecret();
    return jwt.verify(token, secret);
  } catch (error) {
    throw createRequestError(401, 'Token tidak valid atau sudah kadaluarsa.');
  }
}

async function getDbPool(req) {
  const pool = req.app.get('dbPool');
  if (!pool) {
    throw createRequestError(500, 'Database tidak tersedia.');
  }
  return pool;
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi.' });
    }

    const pool = await getDbPool(req);
    const connection = await pool.getConnection();

    try {
      const [users] = await connection.execute(
        'SELECT id, username, password_hash, role FROM users WHERE username = ? AND deleted_at IS NULL',
        [String(username).trim().toLowerCase()]
      );

      const user = Array.isArray(users) ? users[0] : null;
      if (!user || !verifyPassword(password, user.password_hash)) {
        return res.status(401).json({ error: 'Username atau password tidak sesuai.' });
      }

      const token = generateToken(user.id, user.username, user.role);
      return res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Login error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Login gagal.' });
  }
});

// GET /api/auth/verify
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1];

    if (!token) {
      return res.status(401).json({ error: 'Bearer token wajib diisi.' });
    }

    const decoded = verifyToken(token);
    const pool = await getDbPool(req);
    const connection = await pool.getConnection();

    try {
      const [users] = await connection.execute(
        'SELECT id, username, role FROM users WHERE id = ? AND deleted_at IS NULL',
        [decoded.id]
      );

      const user = Array.isArray(users) ? users[0] : null;
      if (!user) {
        return res.status(403).json({ error: 'User tidak ditemukan atau tidak aktif.' });
      }

      return res.json({ user });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Verify error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Verifikasi gagal.' });
  }
});

// POST /api/auth/users (create user - pemilik only)
router.post('/users', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1];

    if (!token) {
      return res.status(401).json({ error: 'Bearer token wajib diisi.' });
    }

    const decoded = verifyToken(token);
    if (decoded.role !== 'pemilik') {
      return res.status(403).json({ error: 'Hanya pemilik yang dapat membuat user baru.' });
    }

    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, dan role wajib diisi.' });
    }

    if (!['kasir', 'pemilik'].includes(role)) {
      return res.status(400).json({ error: 'Role harus kasir atau pemilik.' });
    }

    const pool = await getDbPool(req);
    const connection = await pool.getConnection();

    try {
      const [existing] = await connection.execute(
        'SELECT id FROM users WHERE username = ? AND deleted_at IS NULL',
        [String(username).trim().toLowerCase()]
      );

      if (Array.isArray(existing) && existing.length > 0) {
        return res.status(409).json({ error: 'Username sudah digunakan.' });
      }

      const userId = crypto.randomUUID();
      const passwordHash = hashPassword(password);

      await connection.execute(
        'INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, NOW())',
        [userId, String(username).trim().toLowerCase(), passwordHash, role]
      );

      return res.status(201).json({
        user: { id: userId, username, role },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create user error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Gagal membuat user.' });
  }
});

// GET /api/auth/users (list users - pemilik only)
router.get('/users', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1];

    if (!token) {
      return res.status(401).json({ error: 'Bearer token wajib diisi.' });
    }

    const decoded = verifyToken(token);
    if (decoded.role !== 'pemilik') {
      return res.status(403).json({ error: 'Hanya pemilik yang dapat melihat daftar user.' });
    }

    const pool = await getDbPool(req);
    const connection = await pool.getConnection();

    try {
      const [users] = await connection.execute(
        'SELECT id, username, role, created_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC'
      );

      return res.json({ users: Array.isArray(users) ? users : [] });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('List users error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Gagal mengambil daftar user.' });
  }
});

// PUT /api/auth/users/:id (update user - pemilik only)
router.put('/users/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1];

    if (!token) {
      return res.status(401).json({ error: 'Bearer token wajib diisi.' });
    }

    const decoded = verifyToken(token);
    if (decoded.role !== 'pemilik') {
      return res.status(403).json({ error: 'Hanya pemilik yang dapat update user.' });
    }

    const { id } = req.params;
    const { password, role } = req.body;

    if (!password && !role) {
      return res.status(400).json({ error: 'Password atau role harus diisi untuk update.' });
    }

    if (role && !['kasir', 'pemilik'].includes(role)) {
      return res.status(400).json({ error: 'Role harus kasir atau pemilik.' });
    }

    const pool = await getDbPool(req);
    const connection = await pool.getConnection();

    try {
      let query = 'UPDATE users SET ';
      const params = [];

      if (password) {
        const passwordHash = hashPassword(password);
        query += 'password_hash = ? ';
        params.push(passwordHash);
      }

      if (role) {
        if (password) query += ', ';
        query += 'role = ? ';
        params.push(role);
      }

      query += 'WHERE id = ? AND deleted_at IS NULL';
      params.push(id);

      const [result] = await connection.execute(query, params);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User tidak ditemukan.' });
      }

      return res.json({ message: 'User berhasil diupdate.' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Update user error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Gagal update user.' });
  }
});

// DELETE /api/auth/users/:id (soft delete - pemilik only)
router.delete('/users/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1];

    if (!token) {
      return res.status(401).json({ error: 'Bearer token wajib diisi.' });
    }

    const decoded = verifyToken(token);
    if (decoded.role !== 'pemilik') {
      return res.status(403).json({ error: 'Hanya pemilik yang dapat hapus user.' });
    }

    const { id } = req.params;

    if (id === decoded.id) {
      return res.status(400).json({ error: 'Tidak dapat menghapus user sendiri.' });
    }

    const pool = await getDbPool(req);
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.execute(
        'UPDATE users SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User tidak ditemukan.' });
      }

      return res.json({ message: 'User berhasil dihapus.' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Delete user error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Gagal hapus user.' });
  }
});

export default router;
