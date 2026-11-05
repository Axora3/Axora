import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import crypto from "node:crypto";
import ts from "typescript";

// Exercise the actual route with a storage/DB double. Database locking still
// needs integration verification against the migration before deployment.
let consumed = false, storageFailure = false, expired = false, claims = 0;
const db = {
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: {
    storage_path: "private/template.xlsx", consumed_at: consumed ? new Date().toISOString() : null,
    expires_at: new Date(Date.now() + (expired ? -1000 : 60000)).toISOString(),
  } }) }) }) }),
  storage: { from: () => ({ download: async () => storageFailure ? { error: true } : { data: new Blob(["file bytes"]) } }) },
  rpc: async () => { claims++; const allowed = !consumed; consumed = true; return { data: allowed }; },
};
const code = ts.transpileModule(fs.readFileSync("src/app/download/[token]/route.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
vm.runInNewContext(code, { exports, require: (name) => {
  if (name === "node:crypto") return crypto;
  if (name === "@/lib/supabase/server") return { adminClient: () => db, BUCKETS: { templateFiles: "template-files" } };
  throw Error(name);
}, Response, URL, Date });
const token = "a".repeat(64);
const ctx = { params: Promise.resolve({ token }) };
const request = (method = "GET", origin = "https://axora.example") => new Request(`https://axora.example/download/${token}`, { method, headers: { origin } });
assert.equal((await exports.GET(request(), { params: Promise.resolve({ token: "invalid" }) })).status, 404);
assert.equal((await exports.GET(request(), ctx)).status, 200);
assert.equal(claims, 0, "link scanners must not redeem");
assert.equal((await exports.POST(request("POST", "https://other.example"), ctx)).status, 403);
storageFailure = true;
assert.equal((await exports.POST(request("POST"), ctx)).status, 503);
assert.equal(claims, 0, "failed storage download must preserve entitlement");
storageFailure = false;
expired = true;
assert.equal((await exports.POST(request("POST"), ctx)).status, 410);
assert.equal(claims, 0);
expired = false;
const responses = await Promise.all([exports.POST(request("POST"), ctx), exports.POST(request("POST"), ctx)]);
assert.deepEqual(responses.map(r => r.status).sort(), [200, 410]);
const download = responses.find(r => r.status === 200);
assert.equal(await download.text(), "file bytes");
assert.match(download.headers.get("content-disposition"), /^attachment/);
assert.equal(download.headers.get("location"), null, "must not expose a reusable storage URL");
assert.equal((await exports.GET(request(), ctx)).status, 410);
assert.equal((await exports.POST(request("POST"), ctx)).status, 410);
console.log("Single-use download route checks passed.");
