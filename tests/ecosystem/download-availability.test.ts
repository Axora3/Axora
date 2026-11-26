import { test } from "node:test";
import assert from "node:assert/strict";
import { GET, POST } from "../../src/app/download/[token]/route";

test("download route fails gracefully without backend configuration and keeps origin protection", async () => {
  const saved = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    const token = "a".repeat(64), context = { params: Promise.resolve({ token }) };
    for (const handler of [GET, POST]) {
      const response = await handler(new Request(`http://localhost/download/${token}`, { method: handler === POST ? "POST" : "GET" }), context);
      assert.equal(response.status, 503);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      assert.doesNotMatch(await response.text(), /SUPABASE_SERVICE_ROLE_KEY|stack/i);
    }
    assert.equal((await GET(new Request("http://localhost/download/bad"), { params: Promise.resolve({ token: "bad" }) })).status, 404);
    assert.equal((await POST(new Request(`http://localhost/download/${token}`, { method: "POST", headers: { origin: "https://other.example" } }), context)).status, 403);
  } finally { if (saved === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = saved; }
});
