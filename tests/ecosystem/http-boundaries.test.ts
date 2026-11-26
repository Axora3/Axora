import { test } from "node:test";
import assert from "node:assert/strict";
import { readJson } from "../../src/lib/server/http";

test("JSON reader returns a controlled error when the request stream disconnects", async () => {
  const body = new ReadableStream<Uint8Array>({ start(controller) { controller.error(new Error("client disconnected")); } });
  const request = new Request("http://localhost/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body, duplex: "half" } as RequestInit);
  const result = await readJson(request, 1024);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.res.status, 400);
});

test("JSON reader rejects oversized chunked requests and malformed JSON", async () => {
  for (const [body, limit, status] of [["{", 1024, 400], [JSON.stringify({ text: "a".repeat(100) }), 30, 413]] as const) {
    const request = new Request("http://localhost/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body });
    const result = await readJson(request, limit);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.res.status, status);
  }
});
