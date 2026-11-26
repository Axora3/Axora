import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { standardChecklist } from "../../src/lib/admin/standard-checklist";

test("simultaneous standard checklist inserts leave exactly one set of seven rows", async () => {
  const db = new PGlite();
  try {
    const project = "00000000-0000-4000-8000-000000000001";
    await db.exec(`create table website_projects(id uuid primary key);insert into website_projects values('${project}')`);
    const migration = await readFile("supabase/migrations/20261031000000_admin_modules.sql", "utf8");
    await db.exec(migration.match(/create table if not exists public\.project_milestones \([\s\S]*?\n\);/)![0]);
    const rows = standardChecklist(project);
    const insert = () => db.query(`insert into project_milestones(id,project_id,title,sort_order) values ${rows.map((_,i)=>`($${i*4+1},$${i*4+2},$${i*4+3},$${i*4+4})`).join(",")}`, rows.flatMap(r=>[r.id,r.project_id,r.title,r.sort_order]));
    const result = await Promise.allSettled([insert(), insert()]);
    assert.equal(result.filter(r=>r.status==="fulfilled").length, 1);
    const failed = result.find(r=>r.status==="rejected");
    assert.equal(failed?.status === "rejected" && failed.reason.code, "23505");
    assert.equal((await db.query<{ count: number }>("select count(*)::int as count from project_milestones")).rows[0].count, 7);
    assert.notDeepEqual(standardChecklist("00000000-0000-4000-8000-000000000002").map(r=>r.id),rows.map(r=>r.id));
  } finally { await db.close(); }
});
