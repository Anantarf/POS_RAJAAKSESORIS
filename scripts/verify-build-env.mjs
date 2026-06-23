import "dotenv/config";

const requiredEnv = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const missing = requiredEnv.filter((key) => !String(process.env[key] || "").trim());

if (missing.length > 0) {
  console.error(`Missing required build env: ${missing.join(", ")}`);
  process.exit(1);
}

const supabaseUrl = String(process.env.VITE_SUPABASE_URL || "").trim();

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl)) {
  console.error("VITE_SUPABASE_URL must be a Supabase project URL, for example https://project-ref.supabase.co");
  process.exit(1);
}

console.log("Build env verified.");
