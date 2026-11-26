import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, addMonths, allowedDate, monthGrid } from "../../src/lib/admin/calendar";

test("calendar uses correct Monday-first dates and a stable six-row grid", () => {
  const days = monthGrid("2025-03-07");
  assert.equal(days.length, 42);
  assert.equal(days[0], "2025-02-24");
  assert.equal(days[5], "2025-03-01");
  assert.equal(days.at(-1), "2025-04-06");
  assert.equal(new Set(days).size, 42);
});

test("month/year navigation handles leap days and month boundaries", () => {
  assert.equal(addMonths("2024-01-31", 1), "2024-02-29");
  assert.equal(addMonths("2025-01-31", 1), "2025-02-28");
  assert.equal(addMonths("2024-02-29", 12), "2025-02-28");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});

test("date limits are inclusive and impossible dates cannot be applied", () => {
  assert.equal(allowedDate("2026-11-07", "2026-11-07", "2026-11-14"), true);
  assert.equal(allowedDate("2026-11-14", "2026-11-07", "2026-11-14"), true);
  assert.equal(allowedDate("2026-11-15", "2026-11-07", "2026-11-14"), false);
  assert.equal(allowedDate("2025-02-29"), false);
});
