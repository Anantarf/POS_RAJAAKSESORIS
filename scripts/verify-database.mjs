import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const REQUIRED_TABLES = [
  "users",
  "produk",
  "stok_mutasi",
  "transaksi",
  "item_transaksi",
  "transaksi_digital",
  "transaksi_dompet",
  "transaksi_logistik",
  "kas",
  "shifts",
  "app_settings",
  "audit_logs",
  "financial_logs",
  "product_activity_logs",
  "employee_payrolls",
  "employee_sessions",
  "employee_notes",
  "notification_jobs",
  "operational_events",
  "money_operation_requests",
  "stock_opname_sessions",
  "stock_opname_items",
  "supplier_returns",
  "supplier_return_items",
  "customer_returns",
  "customer_return_items",
  "services_products",
];

const REQUIRED_VIEWS = [
  "transaction_history_summary",
  "sales_report_items",
  "daily_sales_summary",
  "employee_roster_operational",
  "shift_transactions",
  "service_products",
];

const REQUIRED_COLUMNS = {
  users: [
    "id",
    "nama",
    "username",
    "role",
    "status",
    "pin_hash",
    "cashier_station",
    "station_name",
    "base_salary",
    "default_bonus",
    "default_deduction",
  ],
  shifts: ["id", "cashier_id", "employee_name", "cashier_station", "station_name", "shift_type", "status"],
  services_products: ["id", "category", "provider", "service_type", "name", "cost", "default_price", "active"],
  produk: ["id", "nama", "kode_produk", "stok", "harga_beli", "harga_jual", "status", "deleted_at"],
  transaksi: ["id", "no_transaksi", "total_bayar", "kasir_id", "deleted_at", "void_reversal_id"],
  transaksi_dompet: ["id", "platform", "jenis", "nominal", "biaya_admin", "reversal_of"],
  transaksi_digital: ["id", "category", "provider", "service_type", "nominal", "status"],
  stock_opname_sessions: ["id", "status", "created_by", "completed_at"],
  stock_opname_items: ["id", "session_id", "product_id", "real_stock"],
};

const REQUIRED_FUNCTIONS = [
  "resolve_login_email",
  "get_my_profile",
  "verify_user_pin",
  "owner_update_employee_profile",
  "owner_set_employee_status",
  "owner_reset_employee_pin",
  "owner_save_employee_payroll",
  "owner_set_employee_permissions",
  "owner_get_employee_permissions",
  "owner_get_employee_activity",
  "owner_save_employee_note",
  "owner_revoke_employee_session",
  "current_user_has_employee_permission",
  "touch_employee_session",
  "end_employee_session",
  "create_accessory_transaction_atomic",
  "create_digital_transaction_atomic",
  "create_wallet_transaction_atomic",
  "create_cash_entry_atomic",
  "create_supplier_return_atomic",
  "create_customer_return_atomic",
  "close_shift_atomic",
  "void_transaction_atomic",
  "auto_close_expired_active_shifts",
  "purge_expired_deleted_products",
  "purge_expired_deleted_transactions",
  "owner_get_audit_storage_summary",
  "owner_get_audit_storage_breakdown",
  "get_sales_report_summary",
];

function getConfig() {
  return {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  };
}

function quoteList(values) {
  return values.map((value) => `'${String(value).replaceAll("'", "''")}'`).join(",");
}

async function runSql(supabase, sql) {
  const { data, error } = await supabase.rpc("exec_sql", { sql });
  if (error) throw error;
  return data;
}

async function queryInformationSchema(supabase, sql) {
  try {
    return { rows: await runSql(supabase, sql), available: true };
  } catch (error) {
    return { rows: [], available: false, error };
  }
}

function normalizeRows(data) {
  if (Array.isArray(data)) return data;
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function collectMissing(expected, actualSet) {
  return expected.filter((item) => !actualSet.has(item));
}

async function verifyRelationsByPostgrest(supabase, failures) {
  for (const table of [...REQUIRED_TABLES, ...REQUIRED_VIEWS]) {
    const { error } = await supabase.from(table).select("*", { count: "exact", head: true });
    if (error) {
      failures.push(`missing or inaccessible relation: ${table} (${error.message || error.code || "unknown error"})`);
    }
  }
}

async function verifyColumnsByPostgrest(supabase, failures) {
  for (const [table, columns] of Object.entries(REQUIRED_COLUMNS)) {
    const missing = [];
    for (const column of columns) {
      const { error } = await supabase.from(table).select(column, { count: "exact", head: true });
      if (error) missing.push(`${column}${formatPostgrestError(error)}`);
    }
    if (missing.length) {
      failures.push(`missing or inaccessible required columns on ${table}: ${missing.join(", ")}`);
    }
  }
}

function formatPostgrestError(error) {
  const detail = error.message || error.code || error.details || error.hint;
  return detail ? ` (${detail})` : "";
}

async function main() {
  const { url, key } = getConfig();
  if (!url || !key) {
    console.log("Database verification skipped: Supabase env is not configured.");
    console.log("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then run npm run verify:database.");
    return;
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false },
  });

  const relationNames = [...REQUIRED_TABLES, ...REQUIRED_VIEWS];
  const relationResult = await queryInformationSchema(
    supabase,
    `
      select table_name, table_type
      from information_schema.tables
      where table_schema = 'public'
        and table_name in (${quoteList(relationNames)})
      order by table_name;
      `
  );
  const failures = [];
  const warnings = [];

  if (relationResult.available) {
    const relationRows = normalizeRows(relationResult.rows);
    const relationSet = new Set(relationRows.map((row) => row.table_name));
    collectMissing(REQUIRED_TABLES, relationSet).forEach((table) => failures.push(`missing table: ${table}`));
    collectMissing(REQUIRED_VIEWS, relationSet).forEach((view) => failures.push(`missing view: ${view}`));
  } else {
    warnings.push("exec_sql helper is not available; relation checks use PostgREST fallback.");
    await verifyRelationsByPostgrest(supabase, failures);
  }

  const columnChecks = Object.entries(REQUIRED_COLUMNS);
  const columnResult = relationResult.available
    ? await queryInformationSchema(
        supabase,
        `
      select table_name, column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name in (${quoteList(columnChecks.map(([table]) => table))})
      order by table_name, column_name;
      `
      )
    : { rows: [], available: false };

  if (columnResult.available) {
    const columnRows = normalizeRows(columnResult.rows);
    const columnSet = new Set(columnRows.map((row) => `${row.table_name}.${row.column_name}`));
    for (const [table, columns] of columnChecks) {
      collectMissing(
        columns.map((column) => `${table}.${column}`),
        columnSet
      ).forEach((column) => failures.push(`missing column: ${column}`));
    }
  } else {
    await verifyColumnsByPostgrest(supabase, failures);
  }

  const functionResult = relationResult.available
    ? await queryInformationSchema(
        supabase,
        `
      select routine_name
      from information_schema.routines
      where specific_schema = 'public'
        and routine_name in (${quoteList(REQUIRED_FUNCTIONS)})
      order by routine_name;
      `
      )
    : { rows: [], available: false };

  if (functionResult.available) {
    const functionRows = normalizeRows(functionResult.rows);
    const functionSet = new Set(functionRows.map((row) => row.routine_name));
    collectMissing(REQUIRED_FUNCTIONS, functionSet).forEach((fn) => failures.push(`missing function: ${fn}`));
  } else {
    warnings.push("function/RPC existence was not checked live because exec_sql is not available.");
  }

  if (failures.length) {
    console.error("Database verification failed:");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exitCode = 1;
    return;
  }

  console.log("Database verification passed.");
  warnings.forEach((warning) => console.warn(`- warning: ${warning}`));
  console.log(`- ${REQUIRED_TABLES.length} tables found`);
  console.log(`- ${REQUIRED_VIEWS.length} views found`);
  console.log(`- ${Object.values(REQUIRED_COLUMNS).flat().length} required columns found`);
  console.log(
    functionResult.available
      ? `- ${REQUIRED_FUNCTIONS.length} functions found`
      : `- ${REQUIRED_FUNCTIONS.length} functions listed in target but not checked live`
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
