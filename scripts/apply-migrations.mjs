#!/usr/bin/env node
/**
 * Applies the additive admin migrations over a direct Postgres connection.
 * Only the migrations from 20261031000000 onward are run by default; earlier
 * migrations create tables without IF NOT EXISTS and must not be replayed.
 *
 *   node --env-file=.env.local scripts/apply-migrations.mjs
 *   node --env-file=.env.local scripts/apply-migrations.mjs 20261031000000_admin_modules.sql 20261031100000_admin_workflow_hardening.sql
 *
 * Requires DATABASE_URL (Supabase -> Connect -> Session pooler URI). The admin
 * migrations are safe to re-run, so a partial failure can simply be retried.
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const FIRST_ADDITIVE = "20261031000000";
const dir = path.join(process.cwd(), "supabase", "migrations");

function readEnvLocal() {
  const file = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!match || process.env[match[1]] !== undefined) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

readEnvLocal();

if (!process.env.DATABASE_URL) {
  console.error(
    "Missing DATABASE_URL. Add the Supabase Session pooler URI to .env.local:\n" +
      "  DATABASE_URL=postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:5432/postgres\n" +
      "Then run: node --env-file=.env.local scripts/apply-migrations.mjs",
  );
  process.exit(1);
}

const available = fs
  .readdirSync(dir)
  .filter((name) => name.endsWith(".sql"))
  .sort();
const requested = process.argv.slice(2).filter((arg) => arg.endsWith(".sql"));
const files = requested.length ? requested : available.filter((name) => name >= FIRST_ADDITIVE);

if (!files.length) {
  console.error(`No migrations found in ${dir}`);
  process.exit(1);
}

const missing = files.filter((name) => !available.includes(name));
if (missing.length) {
  console.error(`Unknown migration file(s): ${missing.join(", ")}`);
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
  application_name: "axora-apply-migrations",
});

try {
  await client.connect();
  for (const name of files) {
    const sql = fs.readFileSync(path.join(dir, name), "utf8");
    try {
      await client.query(sql);
      console.log(`APPLIED ${name}`);
    } catch (error) {
      await client.query("rollback").catch(() => {});
      console.error(`FAILED  ${name}: ${error.code ? `${error.code} ` : ""}${error.message}`);
      process.exitCode = 1;
      break;
    }
  }
  if (!process.exitCode) {
    // Tables added through SQL run outside the CLI need a PostgREST cache reload.
    await client.query("notify pgrst, 'reload schema'");
    console.log("PostgREST schema cache reload requested.");
    console.log("Verify with: node --env-file=.env.local scripts/check-admin-schema.mjs");
  }
} catch (error) {
  console.error(`Connection failed: ${error.code ? `${error.code} ` : ""}${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
