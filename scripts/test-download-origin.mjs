import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const exports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync("src/lib/server/download-origin.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports, URL });
const resolve = (env, headers = {}) => exports.resolveDownloadOrigin(env, new Headers(headers));
assert.equal(resolve({ NEXT_PUBLIC_SITE_URL: "https://shop.example/" }), "https://shop.example");
assert.equal(resolve({ VERCEL_PROJECT_PRODUCTION_URL: "shop.vercel.app" }), "https://shop.vercel.app");
assert.equal(resolve({}, { origin: "https://shop.example", host: "shop.example" }), "https://shop.example");
assert.equal(resolve({}, { origin: "https://other.example", host: "shop.example" }), null);
assert.equal(resolve({}, { origin: "http://localhost:3000", host: "localhost:3000" }), null);
assert.equal(resolve({ NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "http://localhost:3000", ALLOW_LOCAL_DOWNLOAD_LINKS: "true" }), null);
assert.equal(resolve({ NODE_ENV: "development", ALLOW_LOCAL_DOWNLOAD_LINKS: "true" }, { origin: "http://localhost:3000", host: "localhost:3000" }), "http://localhost:3000");
assert.equal(resolve({ NEXT_PUBLIC_SITE_URL: "https://user:secret@shop.example" }), null);
console.log("Download origin checks passed.");
