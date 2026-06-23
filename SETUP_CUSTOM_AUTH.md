# Setup Custom User Management

Panduan setup custom authentication tanpa Supabase untuk POS Raja Aksesoris.

## 📋 Langkah-Langkah Setup

### 1. Backend Setup

#### 1.1 Install Dependencies
```bash
cd backend
npm install
```

#### 1.2 Configure Environment Variables
Copy `.env.example` ke `.env` dan isi:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=pos_raja_db
PORT=3002

# JWT Secret (ganti dengan string panjang yang aman!)
JWT_SECRET=your-very-long-secret-key-change-this-in-production

# CORS
CORS_ORIGIN=http://localhost:5173,https://pos-app-gilt-one.vercel.app

# Opsional
FONNTE_TOKEN=YOUR_TOKEN_HERE
FONNTE_TARGETS=6287884820507
```

#### 1.3 Create Users Table & Admin Account
```bash
npm run setup:auth
```

Ikuti prompt untuk membuat admin account pertama.

#### 1.4 Run Backend
```bash
npm run dev
```

Backend akan berjalan di `http://localhost:3002`

---

### 2. Frontend Setup

#### 2.1 Update AuthProvider
Replace the AuthProvider import in `src/App.jsx`:

**Before:**
```javascript
import { AuthProvider } from "./contexts/AuthProvider";
```

**After:**
```javascript
import { AuthProvider } from "./contexts/AuthProvider.custom";
```

Atau rename file:
```bash
mv src/contexts/AuthProvider.jsx src/contexts/AuthProvider.supabase.jsx
mv src/contexts/AuthProvider.custom.jsx src/contexts/AuthProvider.jsx
```

#### 2.2 Install Dependencies (if needed)
```bash
npm install
```

#### 2.3 Run Frontend
```bash
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

---

### 3. Test Login

1. Buka http://localhost:5173
2. Login dengan username dan password yang dibuat di step 1.3
3. Selesai!

---

## 🔧 API Endpoints

### Authentication

**POST /api/auth/login**
```json
{
  "username": "kasir1",
  "password": "password123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "username": "kasir1",
    "role": "kasir"
  }
}
```

**GET /api/auth/verify**
Header: `Authorization: Bearer <token>`

Response:
```json
{
  "user": {
    "id": "uuid",
    "username": "kasir1",
    "role": "kasir"
  }
}
```

### User Management (Admin Only)

**GET /api/auth/users** - List all users
Header: `Authorization: Bearer <admin_token>`

**POST /api/auth/users** - Create new user
Header: `Authorization: Bearer <admin_token>`
```json
{
  "username": "kasir2",
  "password": "password123",
  "role": "kasir"
}
```

**PUT /api/auth/users/:id** - Update user
Header: `Authorization: Bearer <admin_token>`
```json
{
  "password": "newpassword123",
  "role": "pemilik"
}
```

**DELETE /api/auth/users/:id** - Delete user
Header: `Authorization: Bearer <admin_token>`

---

## 🚀 Deploy to Vercel

### 1. Update Environment Variables di Vercel Dashboard

- `JWT_SECRET`: Ganti dengan secret yang kuat
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: Sesuaikan dengan database production
- `CORS_ORIGIN`: Tambahkan domain Vercel Anda

### 2. Deploy Frontend
```bash
vercel deploy --prod
```

### 3. Database Must Be Accessible
Backend memerlukan akses ke MySQL database. Pastikan:
- Database sudah dibuat dan table `users` sudah ada
- Connection pooling sudah di-setup

---

## 🔐 Security Tips

1. **JWT_SECRET**: Gunakan string panjang yang random dan aman
   ```bash
   # Generate secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Password Hashing**: Passwords di-hash dengan PBKDF2-SHA256
   - Salt: `pos-salt-2024` (bisa diganti di `backend/routes/auth.js`)
   - Iterations: 10000

3. **Token Expiration**: Token JWT expires dalam 24 jam

4. **HTTPS**: Selalu gunakan HTTPS di production

---

## 🐛 Troubleshooting

### Database Connection Error
- Pastikan MySQL running
- Cek credentials di `.env`
- Jalankan migration: `npm run setup:auth`

### Login Gagal
- Pastikan username dan password benar
- Check backend logs
- Verifikasi user sudah dibuat di database

### Token Invalid
- Token sudah expired (24 jam)
- User sudah dihapus
- JWT_SECRET berubah di server

### CORS Error
- Update `CORS_ORIGIN` di backend `.env`
- Pastikan frontend URL di-include

---

## 📝 Next Steps

1. Setup user management UI di POS (admin panel)
2. Add password reset functionality
3. Add 2FA (Two-Factor Authentication)
4. Add audit logging untuk user management

---

Pertanyaan? Check `backend/routes/auth.js` untuk implementasi detail.
