import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRevenueBuckets } from "../../src/lib/admin/revenue-trend";

test("income buckets keep currencies separate and count each boundary payment once", () => {
  const rows = buildRevenueBuckets("2026-11-16T16:00:00Z", "2026-11-23T16:00:00Z", [
    { at: "2026-11-16T15:59:59Z", amount: 999, currency: "MNT" },
    { at: "2026-11-16T16:00:00Z", amount: 120000, currency: "MNT" },
    { at: "2026-11-17T16:00:00Z", amount: 50000, currency: "MNT" },
    { at: "2026-11-17T16:00:00Z", amount: 25, currency: "USD" },
    { at: "2026-11-23T16:00:00Z", amount: 999, currency: "MNT" },
  ]);
  assert.equal(rows.length, 7);
  assert.deepEqual(rows[0].totals, { MNT: 120000 });
  assert.deepEqual(rows[1].totals, { MNT: 50000, USD: 25 });
  assert.equal(rows.reduce((sum, row) => sum + (row.totals.MNT ?? 0), 0), 170000);
  assert.deepEqual(rows.at(-1)?.totals, {});
});

test("long date ranges keep all confirmed income in at most seven buckets", () => {
  const rows = buildRevenueBuckets("2026-01-01T16:00:00Z", "2026-12-31T16:00:00Z", [
    { at: "2026-01-01T16:00:00Z", amount: 10, currency: "USD" },
    { at: "2026-12-31T15:59:59Z", amount: 20, currency: "USD" },
  ]);
  assert.ok(rows.length <= 7);
  assert.equal(rows.reduce((sum, row) => sum + (row.totals.USD ?? 0), 0), 30);
});
