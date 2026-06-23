import { createClient } from "@supabase/supabase-js";

function getSupabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

function sendJson(res, status, payload) {
  return res.status(status).json(payload);
}

function getBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match?.[1] || "";
}

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function buildAuthEmail(username) {
  const domain = String(process.env.AUTH_INTERNAL_EMAIL_DOMAIN || "rajaaksesoris.local")
    .trim()
    .toLowerCase();
  return `${username}@${domain}`;
}

function validatePayload(body) {
  const nama = String(body?.nama || body?.name || "").trim();
  const username = normalizeUsername(body?.username);
  const password = String(body?.password || "");
  const role = body?.role === "pemilik" ? "pemilik" : "kasir";

  if (!nama) throw new Error("Nama pengguna wajib diisi.");
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) {
    throw new Error("Username harus 3-40 karakter dan hanya boleh huruf, angka, titik, underscore, atau strip.");
  }
  if (password.length < 8) throw new Error("Password minimal 8 karakter.");

  return { nama, username, authEmail: buildAuthEmail(username), password, role };
}

async function getOwnerProfile(token, config) {
  const userClient = createClient(config.url, config.anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  const { data: { user }, error: userError } = await userClient.auth.getUser(token);
  if (userError || !user) throw new Error("Sesi owner tidak valid.");

  const { data: profile, error: profileError } = await userClient
    .from("users")
    .select("id, role, status")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) throw new Error("Profil owner tidak ditemukan.");
  if (profile.role !== "pemilik") throw new Error("Hanya pemilik yang dapat membuat pengguna.");
  if (profile.status && profile.status !== "active") throw new Error("Akun owner tidak aktif.");

  return profile;
}

export async function employeesHandler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { ok: false, error: "Method not allowed." });
  }

  const config = getSupabaseConfig();

  if (!config.url || !config.anonKey || !config.serviceRoleKey) {
    return sendJson(res, 500, {
      ok: false,
      error: "Server belum memiliki SUPABASE_URL, SUPABASE_ANON_KEY, atau SUPABASE_SERVICE_ROLE_KEY.",
    });
  }

  try {
    const token = getBearerToken(req);
    if (!token) return sendJson(res, 401, { ok: false, error: "Bearer token wajib diisi." });

    const owner = await getOwnerProfile(token, config);
    const payload = validatePayload(req.body || {});
    const adminClient = createClient(config.url, config.serviceRoleKey, {
      auth: { persistSession: false },
    });

    if (payload.role === "pemilik") {
      const { count, error } = await adminClient
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "pemilik")
        .eq("status", "active")
        .is("archived_at", null);
      if (error) throw error;
      if (count > 0) throw new Error("Tidak bisa membuat lebih dari satu owner aktif.");
    }

    const { data: existingUsername, error: usernameError } = await adminClient
      .from("users")
      .select("id")
      .ilike("username", payload.username)
      .is("archived_at", null)
      .maybeSingle();
    if (usernameError) throw usernameError;
    if (existingUsername) throw new Error("Username sudah dipakai.");

    const { data: authResult, error: createError } = await adminClient.auth.admin.createUser({
      email: payload.authEmail,
      password: payload.password,
      email_confirm: true,
      user_metadata: { name: payload.nama, role: payload.role },
    });
    if (createError) throw createError;

    const createdUser = authResult.user;
    const { data: profile, error: profileError } = await adminClient
      .from("users")
      .upsert(
        { id: createdUser.id, nama: payload.nama, username: payload.username, role: payload.role, status: "active" },
        { onConflict: "id" }
      )
      .select("id, nama, username, role, status")
      .single();

    if (profileError) {
      await adminClient.auth.admin.deleteUser(createdUser.id).catch(() => {});
      throw profileError;
    }

    await adminClient.from("audit_logs").insert({
      actor_id: owner.id,
      actor_role: "pemilik",
      action: "employee.create",
      target_table: "users",
      target_id: createdUser.id,
      before_value: {},
      after_value: { id: profile.id, nama: profile.nama, username: profile.username, role: profile.role, status: profile.status },
      reason: "Tambah pengguna",
      incident_code: "EMPLOYEE-MANAGEMENT",
    });

    return sendJson(res, 201, { ok: true, employee: profile });
  } catch (error) {
    return sendJson(res, 400, { ok: false, error: error.message || "Gagal membuat pengguna." });
  }
}
